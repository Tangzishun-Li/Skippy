import React from 'react'
import './EventPopup.css'

export default function EventPopup({ position, title, onTitleChange, onSave, onClose, onKeyDown, draftEvent }) {
  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div 
      className="event-popup-card"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
      }}
    >
      <div className="popup-header">
        <span className="close-btn" onClick={onClose}>✕</span>
      </div>
      <div className="popup-body">
        <input 
          autoFocus
          type="text" 
          placeholder="添加课程或任务名称..." 
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {draftEvent && (
          <div className="time-display">
            {formatTime(draftEvent.startStr)} - {formatTime(draftEvent.endStr)}
          </div>
        )}
      </div>
      <div className="popup-footer">
        <button className="save-btn" onClick={onSave}>保存</button>
      </div>
    </div>
  )
}
