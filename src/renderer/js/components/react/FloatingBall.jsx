import React, { useState, useEffect } from 'react'
import MiniCalendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import './FloatingBall.css'

export default function FloatingBall() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [todayEvents, setTodayEvents] = useState([])
  const [nextEvent, setNextEvent] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTime, setEditTime] = useState('')

  useEffect(() => {
    if (isExpanded) {
      fetchTodayData()
    }
  }, [isExpanded])

  const fetchTodayData = async () => {
    if (window.electronAPI?.db) {
      const events = await window.electronAPI.db.getTodayEvents()
      setTodayEvents(events || [])
      calculateNextEvent(events || [])
    }
  }

  const calculateNextEvent = (events) => {
    const now = new Date()
    const upcoming = events.find(e => new Date(e.rawStart) > now)
    setNextEvent(upcoming || null)
  }

  const toggleExpand = async () => {
    const nextState = !isExpanded
    if (window.electronAPI) {
      await window.electronAPI.resizeFloatWindow(nextState)
    }
    setIsExpanded(nextState)
  }

  const handleEditClick = (event) => {
    setEditingEvent(event)
    setEditTitle(event.title)
    setEditTime(event.startTimeStr)
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return

    const datePrefix = editingEvent.rawStart.substring(0, 11)
    const newStartStr = `${datePrefix}${editTime}:00`

    if (window.electronAPI?.db) {
      await window.electronAPI.db.updateEvent({
        id: editingEvent.id,
        title: editTitle,
        start: newStartStr
      })
      await fetchTodayData()
      setEditingEvent(null)
    }
  }

  const handleDelete = async () => {
    if (window.electronAPI?.db) {
      await window.electronAPI.db.deleteEvent(editingEvent.id)
      await fetchTodayData()
      setEditingEvent(null)
    }
  }

  if (!isExpanded) {
    return (
      <div className="float-ball-collapsed drag-area" onDoubleClick={toggleExpand}>
        <span className="ball-icon">📅</span>
      </div>
    )
  }

  return (
    <div className="float-panel-expanded">
      <div className="panel-header drag-area">
        <span className="panel-title">
          {editingEvent ? '编辑日程' : 'Skippy'}
        </span>
        <button className="close-btn no-drag" onClick={toggleExpand}>—</button>
      </div>

      <div className="panel-content no-drag">
        {editingEvent ? (
          <div className="edit-view animation-fade-in">
            <div className="edit-form-group">
              <label>日程名称</label>
              <input 
                autoFocus
                type="text" 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)} 
                className="edit-input"
              />
            </div>
            <div className="edit-form-group">
              <label>开始时间</label>
              <input 
                type="time" 
                value={editTime} 
                onChange={(e) => setEditTime(e.target.value)} 
                className="edit-input time-input"
              />
            </div>
            
            <div className="edit-actions">
              <button className="btn-save" onClick={handleSaveEdit}>保存修改</button>
              <button className="btn-delete" onClick={handleDelete}>删除</button>
              <button className="btn-cancel" onClick={() => setEditingEvent(null)}>取消</button>
            </div>
          </div>
        ) : (
          <div className="view-container animation-fade-in">
            <div className="quick-actions">
              <button className="action-btn">✨ 新建日程</button>
            </div>

            <div className="today-agenda">
              <h4 className="agenda-title">今日日程</h4>
              <div className="agenda-list">
                {todayEvents.length === 0 ? (
                  <div className="empty-state">今天没有任何安排，好好休息吧！</div>
                ) : (
                  todayEvents.map(event => (
                    <div key={event.id} className="agenda-item interactive-item" onClick={() => handleEditClick(event)}>
                      <div className="agenda-time">{event.startTimeStr}</div>
                      <div className="agenda-info">
                        <div className="agenda-name">{event.title}</div>
                        {event.endTimeStr && <div className="agenda-duration">至 {event.endTimeStr}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className={`next-class-alert ${!nextEvent ? 'no-alert' : ''}`}>
               {nextEvent ? `下一节：${nextEvent.startTimeStr} ${nextEvent.title}` : '今日任务已全部结束 🎉'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
