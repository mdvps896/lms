import React, { useRef } from 'react';
import { FiTrash2, FiPlus, FiMove, FiImage } from 'react-icons/fi';
import ImageUploader from './ImageUploader';

const MCQ = ({ options, setOptions, hasImageOptions, setHasImageOptions }) => {
    const dragItem = useRef();
    const dragOverItem = useRef();

    const handleAddOption = () => {
        setOptions([...options, { text: '', image: '', isCorrect: false, order: options.length }]);
    };

    const handleRemoveOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions.map((opt, i) => ({ ...opt, order: i })));
    };

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...options];
        newOptions[index][field] = value;
        setOptions(newOptions);
    };

    const handleCorrectChange = (index) => {
        const newOptions = options.map((opt, i) => ({
            ...opt,
            isCorrect: i === index
        }));
        setOptions(newOptions);
    };

    const onDragStart = (e, index) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = "move";
        // Make the drag ghost image transparent or style it if needed
    };

    const onDragEnter = (e, index) => {
        dragOverItem.current = index;
        
        // Optional: Live reordering visual feedback
        // If you want live reordering, you can implement swapping here
        // But for simplicity and stability, we'll do it on drop
        
        const copyListItems = [...options];
        const dragItemContent = copyListItems[dragItem.current];
        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = index; // Update dragItem to new index
        setOptions(copyListItems);
    };

    const onDragEnd = () => {
        // Finalize order
        const newOptions = options.map((opt, i) => ({ ...opt, order: i }));
        setOptions(newOptions);
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <label className="form-label fw-bold">Options</label>
                <div className="form-check form-switch">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="imageOptionsToggle"
                        checked={hasImageOptions}
                        onChange={(e) => setHasImageOptions(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="imageOptionsToggle">Use Image Options</label>
                </div>
            </div>

            {options.map((option, index) => (
                <div 
                    key={index} 
                    className="card mb-2"
                    draggable
                    onDragStart={(e) => onDragStart(e, index)}
                    onDragEnter={(e) => onDragEnter(e, index)}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    style={{ cursor: 'move' }}
                >
                    <div className="card-body p-2">
                        <div className="d-flex align-items-center gap-2">
                            <div className="d-flex flex-column text-muted pe-2" style={{ cursor: 'grab' }}>
                                <FiMove size={18} />
                            </div>
                            
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="correctOption"
                                    checked={option.isCorrect}
                                    onChange={() => handleCorrectChange(index)}
                                    title="Mark as correct"
                                />
                            </div>

                            <div className="flex-grow-1">
                                {hasImageOptions ? (
                                    <ImageUploader 
                                        value={option.image} 
                                        onChange={(val) => handleOptionChange(index, 'image', val)} 
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder={`Option ${index + 1}`}
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                    />
                                )}
                            </div>

                            <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveOption(index)}
                                title="Remove option"
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={handleAddOption}>
                <FiPlus className="me-1" /> Add Option
            </button>
        </div>
    );
};

export default MCQ;
