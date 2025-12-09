import React from 'react';

const LongAnswer = ({ wordLimit, setWordLimit }) => {
    return (
        <div className="mt-3">
            <div className="alert alert-info mb-3">
                Long answer questions are evaluated manually.
            </div>
            <div className="form-group">
                <label className="form-label">Word Limit (Optional)</label>
                <input 
                    type="number" 
                    className="form-control" 
                    min="0"
                    placeholder="Enter word limit (0 for no limit)"
                    value={wordLimit}
                    onChange={(e) => setWordLimit(parseInt(e.target.value) || 0)}
                />
                <small className="text-muted">Maximum number of words allowed for the answer.</small>
            </div>
        </div>
    );
};

export default LongAnswer;
