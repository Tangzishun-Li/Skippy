import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import MiniCalendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import EventPopup from './EventPopup'
import './CalendarApp.css'

export default function CalendarApp() {
  const calendarRef = useRef(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 })
  const [draftEvent, setDraftEvent] = useState(null)
  const [eventTitle, setEventTitle] = useState('')

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    if (window.electronAPI?.db) {
      const dbEvents = await window.electronAPI.db.getEvents()
      setEvents(dbEvents || [])
    }
  }

  const handleDateSelect = (selectInfo) => {
    const mouseX = selectInfo.jsEvent.clientX
    const mouseY = selectInfo.jsEvent.clientY
    const popupWidth = 300
    const popupHeight = 150
    const finalX = mouseX + popupWidth > window.innerWidth ? window.innerWidth - popupWidth - 20 : mouseX
    const finalY = mouseY + popupHeight > window.innerHeight ? window.innerHeight - popupHeight - 20 : mouseY

    setPopupPos({ x: finalX, y: finalY })
    setDraftEvent(selectInfo)
    setEventTitle('')
    setShowPopup(true)
  }

  const handleUnselect = () => {
    setShowPopup(false)
  }

  const handleSaveEvent = async () => {
    if (eventTitle.trim() && draftEvent) {
      const newEvent = {
        id: `skippy_${Date.now()}`,
        title: eventTitle,
        start: draftEvent.startStr,
        end: draftEvent.endStr,
        allDay: draftEvent.allDay,
        category: 'default'
      }

      if (window.electronAPI?.db) {
        await window.electronAPI.db.addEvent(newEvent)
      }

      setEvents(prevEvents => [...prevEvents, {
        id: newEvent.id,
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end,
        allDay: newEvent.allDay,
        backgroundColor: '#4285F4'
      }])
    }
    closePopup()
  }

  const closePopup = () => {
    setShowPopup(false)
    if (draftEvent) {
      draftEvent.view.calendar.unselect()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveEvent()
    if (e.key === 'Escape') closePopup()
  }

  const handleMiniCalendarChange = (newDate) => {
    setCurrentDate(newDate)
    let calendarApi = calendarRef.current.getApi()
    calendarApi.gotoDate(newDate)
  }

  const handleMainCalendarDatesSet = (dateInfo) => {
    setCurrentDate(dateInfo.view.currentStart)
  }

  const handleEventDrop = async (dropInfo) => {
    const eventData = {
      id: dropInfo.event.id,
      title: dropInfo.event.title,
      start: dropInfo.event.startStr,
      end: dropInfo.event.endStr
    }
    if (window.electronAPI?.db) {
      await window.electronAPI.db.updateEvent(eventData)
    }
  }

  const handleEventResize = async (resizeInfo) => {
    const eventData = {
      id: resizeInfo.event.id,
      title: resizeInfo.event.title,
      start: resizeInfo.event.startStr,
      end: resizeInfo.event.endStr
    }
    if (window.electronAPI?.db) {
      await window.electronAPI.db.updateEvent(eventData)
    }
  }

  const handleEventClick = (clickInfo) => {
    const newTitle = prompt('修改日程标题:', clickInfo.event.title)
    if (newTitle) {
      clickInfo.event.setProp('title', newTitle)
      if (window.electronAPI?.db) {
        window.electronAPI.db.updateEvent({
          id: clickInfo.event.id,
          title: newTitle,
          start: clickInfo.event.startStr,
          end: clickInfo.event.endStr
        })
      }
    }
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <button className="create-btn" onClick={() => {
            const today = new Date()
            const start = new Date(today)
            start.setHours(9, 0, 0, 0)
            const end = new Date(today)
            end.setHours(10, 0, 0, 0)
            
            setPopupPos({ x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 100 })
            setDraftEvent({
              startStr: start.toISOString(),
              endStr: end.toISOString(),
              allDay: false,
              view: { calendar: calendarRef.current?.getApi() }
            })
            setShowPopup(true)
          }}>
            + 创建日程
          </button>
        </div>
        
        <div className="mini-calendar-wrapper">
          <MiniCalendar 
            onChange={handleMiniCalendarChange} 
            value={currentDate} 
            locale="zh-CN"
            prev2Label={null}
            next2Label={null}
          />
        </div>

        <div className="calendar-filters">
           <h3>我的日历</h3>
           <div className="filter-item">
             <input type="checkbox" id="filter-course" defaultChecked />
             <label htmlFor="filter-course">课程</label>
           </div>
           <div className="filter-item">
             <input type="checkbox" id="filter-task" defaultChecked />
             <label htmlFor="filter-task">任务</label>
           </div>
        </div>
      </div>

      <div className="main-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'today prev,next',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView="timeGridWeek"
          locale="zh-cn"
          buttonText={{
            today: '今天',
            month: '月',
            week: '周',
            day: '日'
          }}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          slotMinTime="07:00:00"
          slotMaxTime="23:00:00"
          events={events}
          select={handleDateSelect}
          unselect={handleUnselect}
          unselectAuto={false}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClick={handleEventClick}
          datesSet={handleMainCalendarDatesSet}
          height="100%"
        />
        
        {showPopup && (
          <EventPopup
            position={popupPos}
            title={eventTitle}
            onTitleChange={setEventTitle}
            onSave={handleSaveEvent}
            onClose={closePopup}
            onKeyDown={handleKeyDown}
            draftEvent={draftEvent}
          />
        )}
      </div>
    </div>
  )
}
