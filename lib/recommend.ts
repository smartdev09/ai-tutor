import { TfIdf } from 'natural';
import cosine from 'compute-cosine-similarity';
import type { DBCourse } from '@/types';
import { supabase } from './supabase/client';

interface CoursesCache {
    slug: string;
    title: string;
    metaDescription?: string;
}
const tfidf = new TfIdf();
let coursesCache: CoursesCache[] = [];
let simsCache: number[][] = [];
let vocabulary: string[] = [];

/**
 * 1. Load all courses & build TF-IDF model
 */
export async function initModel() {
  // 1a) Fetch from Supabase
  const { data: fetchedCourses, error } = await supabase
    .from('courses')
    .select('slug, title, metaDescription');

  if (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
  if (!fetchedCourses?.length) {
    throw new Error('No courses returned from database');
  }

  // 1b) Populate global cache
  coursesCache = fetchedCourses;

  // 1c) Add each course document to TF-IDF
  coursesCache.forEach((c) => {
    const text = [c.title, c.metaDescription || ''].join(' ');
    tfidf.addDocument(text);
  });

  // 1d) Build global vocabulary from all docs
  const vocabSet = new Set<string>();
  coursesCache.forEach((_, i) => {
    tfidf.listTerms(i).forEach((t) => vocabSet.add(t.term));
  });
  vocabulary = Array.from(vocabSet);

  // 1e) Build full Boolean TF-IDF vectors for every document
  const vectors: number[][] = coursesCache.map((_, i) =>
    vocabulary.map((term) => tfidf.tfidf(term, i))
  );

  // 1f) Compute and cache the full cosine-similarity matrix
  simsCache = vectors.map((vi) =>
    vectors.map((vj) => cosine(vi, vj) || 0)
  );
}

/**
 * 2. For a given slug, return top N related courses
 */
export function getRelated(slug: string, N = 5) {
  if (!simsCache.length) {
    throw new Error('TF-IDF model not initialized – call initModel() first');
  }

  const idx = coursesCache.findIndex((c) => c.slug === slug);
  if (idx < 0) {
    // slug not found
    return [];
  }

  return simsCache[idx]
    .map((score, j) => ({ slug: coursesCache[j].slug, score }))
    .filter((_, j) => j !== idx)           // exclude self
    .sort((a, b) => b.score - a.score)    // highest similarity first
    .slice(0, N)                          // take top N
    .map((r) => ({ slug: r.slug }));     // return only slug
}

/**
 * 3. Expose caches for inspection or other uses (optional)
 */
export function getCacheTypes() {
  return {
    coursesType: (coursesCache as DBCourse[]),
    vocabType: (vocabulary as string[]),
    simsType: (simsCache as number[][]),
  };
}
