
import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSave, FiGlobe, FiFacebook, FiInstagram, FiTwitter, FiLinkedin, FiYoutube, FiMenu } from 'react-icons/fi';
import { FaTelegram, FaWhatsapp, FaPinterest, FaTiktok, FaSnapchat } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const SocialMediaSettings = ({ settings, onUpdate, saving }) => {
    const [links, setLinks] = useState([]);
    const [newLink, setNewLink] = useState({ platform: '', url: '', icon: '' });

    // Map of available icons
    const iconMap = {
        'Facebook': <FiFacebook />,
        'Instagram': <FiInstagram />,
        'Twitter': <FiTwitter />,
        'LinkedIn': <FiLinkedin />,
        'YouTube': <FiYoutube />,
        'Telegram': <FaTelegram />,
        'WhatsApp': <FaWhatsapp />,
        'Pinterest': <FaPinterest />,
        'TikTok': <FaTiktok />,
        'Snapchat': <FaSnapchat />,
        'Website': <FiGlobe />
    };

    const platformOptions = Object.keys(iconMap);

    useEffect(() => {
        if (settings?.socialMediaLinks) {
            setLinks(settings.socialMediaLinks);
        }
    }, [settings]);

    const handleAddLink = () => {
        if (!newLink.platform || !newLink.url) return;

        const updatedLinks = [...links, { ...newLink, enabled: true }];
        setLinks(updatedLinks);
        setNewLink({ platform: '', url: '', icon: '' });
    };

    const handleRemoveLink = (index) => {
        const updatedLinks = links.filter((_, i) => i !== index);
        setLinks(updatedLinks);
    };

    const handleToggleLink = (index) => {
        const updatedLinks = [...links];
        updatedLinks[index].enabled = !updatedLinks[index].enabled;
        setLinks(updatedLinks);
    };

    const handleSave = () => {
        onUpdate(links);
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(links);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setLinks(items);
    };

    return (
        <div className="social-media-settings">
            <div className="alert alert-info">
                Add up to 10 social media links. Drag and drop items to reorder them in the app.
            </div>

            <div className="mb-4 p-3 bg-light rounded shadow-sm">
                <h6 className="mb-3 fw-bold">Add New Link</h6>
                <div className="row g-2 align-items-end">
                    <div className="col-md-4">
                        <label className="form-label small">Platform</label>
                        <select
                            className="form-select"
                            value={newLink.platform}
                            onChange={(e) => setNewLink({ ...newLink, platform: e.target.value, icon: e.target.value })}
                        >
                            <option value="">Select Platform</option>
                            {platformOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small">URL</label>
                        <input
                            type="url"
                            className="form-control"
                            placeholder="https://..."
                            value={newLink.url}
                            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        />
                    </div>
                    <div className="col-md-2">
                        <button
                            className="btn btn-primary w-100"
                            onClick={handleAddLink}
                            disabled={!newLink.platform || !newLink.url || links.length >= 10}
                        >
                            <FiPlus className="me-1" /> Add
                        </button>
                    </div>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="social-links-list">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="list-group"
                        >
                            {links.length === 0 && (
                                <div className="text-center py-5 text-muted border rounded bg-light">
                                    No social media links added yet.
                                </div>
                            )}

                            {links.map((link, index) => (
                                <Draggable key={`${link.platform}-${index}`} draggableId={`${link.platform}-${index}`} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`list-group-item d-flex align-items-center gap-3 p-3 mb-2 border rounded ${snapshot.isDragging ? 'shadow-lg bg-white border-primary' : 'bg-white'}`}
                                            style={{
                                                ...provided.draggableProps.style,
                                                transform: provided.draggableProps.style?.transform,
                                            }}
                                        >
                                            <div {...provided.dragHandleProps} className="text-muted cursor-move d-flex align-items-center" title="Drag to reorder">
                                                <FiMenu size={20} />
                                            </div>

                                            <div className="avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center text-primary" style={{ width: '40px', height: '40px' }}>
                                                {iconMap[link.platform] || <FiGlobe />}
                                            </div>

                                            <div className="flex-grow-1 overflow-hidden">
                                                <div className="fw-bold">{link.platform}</div>
                                                <div className="text-muted small text-truncate">
                                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-muted">
                                                        {link.url}
                                                    </a>
                                                </div>
                                            </div>

                                            <div className="form-check form-switch pt-1">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={link.enabled}
                                                    onChange={() => handleToggleLink(index)}
                                                    role="button"
                                                />
                                            </div>

                                            <button
                                                className="btn btn-sm btn-outline-danger border-0 p-2"
                                                onClick={() => handleRemoveLink(index)}
                                                title="Remove"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                <button
                    className="btn btn-primary px-4 py-2"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <>Saving...</>
                    ) : (
                        <><FiSave className="me-2" /> Save Order & Changes</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SocialMediaSettings;
