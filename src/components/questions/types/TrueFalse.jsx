import React, { useEffect, useRef } from 'react';
import { FiImage, FiMove } from 'react-icons/fi';
import ImageUploader from './ImageUploader';

const TrueFalse = ({ options, setOptions, hasImageOptions, setHasImageOptions }) => {
    const dragItem = useRef();
    const dragOverItem = useRef();
    
    useEffect(() => {
        setHasImageOptions(false);
        // Initialize with True/False if empty
        if (options.length === 0) {
            setOptions([
                { text: 'True', image: '', isCorrect: true, order: 0 },
                { text: 'False', image: '', isCorrect: false, order: 1 }
            ]);
        }
    }, []);

    const handleCorrectChange = (index) => {
        const newOptions = options.map((opt, i) => ({
            ...opt,
            isCorrect: i === index
        }));
        setOptions(newOptions);
    };

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...options];
        newOptions[index][field] = value;
        setOptions(newOptions);
    };

    const onDragStart = (e, index) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragEnter = (e, index) => {
        dragOverItem.current = index;
        const copyListItems = [...options];
        const dragItemContent = copyListItems[dragItem.current];
        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = index;
        setOptions(copyListItems);
    };

    const onDragEnd = () => {
        const newOptions = options.map((opt, i) => ({ ...opt, order: i }));
        setOptions(newOptions);
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <label className="form-label fw-bold">True / False Options</label>
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
                                    name="correctOptionTF"
                                    checked={option.isCorrect}
                                    onChange={() => handleCorrectChange(index)}
                                    title="Mark as correct"
                                />
                            </div>
                            
                            <div className="flex-grow-1">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={option.text}
                                    readOnly
                                    disabled
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TrueFalse;
