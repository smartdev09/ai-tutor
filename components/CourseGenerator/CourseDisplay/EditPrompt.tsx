import { useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
//import { useTranslations } from "next-intl";
import obj from '../../../messages/en.json'
interface ContextModalProps {
    onSubmit: (context: string) => void;
}

export default function ContextModalButton({ onSubmit }: ContextModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [contextInput, setContextInput] = useState("");
//    const t = useTranslations()

    const handleSubmit = () => {
        onSubmit(contextInput);
        setContextInput("");
        setIsOpen(false);
    };

    return (
        <>
            {/* Button to open modal */}
            <button
                onClick={() => setIsOpen(true)}
                className="z-50 fixed top-4 right-28 inline-flex items-center justify-center px-2.5 py-2.5 overflow-hidden font-semibold text-white transition-all duration-300 bg-primary rounded-full shadow-lg hover:bg-purple-700 hover:shadow-xl active:scale-95"
            >
                <span title={obj['edit-prompt'].addContextButtonTitle} className="z-10">
                    <Edit />
                </span>
            </button>

            {/* Modal overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-[35%] p-6 bg-white rounded-lg shadow-xl">
                        <div className="flex flex-col">
                            <h2 className="mb-4 text-xl font-semibold text-gray-800">
                                {obj['edit-prompt'].modalTitle}
                            </h2>
                            <p className="mb-3 text-sm text-gray-600">
                                {obj['edit-prompt'].modalDescription}
                            </p>

                            <textarea
                                value={contextInput}
                                onChange={(e) => setContextInput(e.target.value)}
                                className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                rows={4}
                                placeholder={obj['edit-prompt'].textareaPlaceholder}
                            />

                            <p className="mb-4 text-sm text-gray-600">
                                {obj['edit-prompt'].completeSentenceText}
                            </p>

                            <div className="flex justify-end space-x-2">
                                <Button
                                    onClick={() => setIsOpen(false)}
                                    className="hover:bg-gray-300"
                                    variant={"outline"}
                                >
                                    {obj['edit-prompt'].cancelButton}
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                >
                                    {obj['edit-prompt'].modifyPromptButton}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
