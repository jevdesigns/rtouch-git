import React, { useState, useRef } from 'react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useHass } from './useHass';

// --- HOOK: Long Press ---
const useLongPress = (onLongPress, onClick, { delay = 600 } = {}) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef();
  const target = useRef();

  const start = (event) => {
    if (event.target) target.current = event.target;
    timeout.current = setTimeout(() => {
      onLongPress(event);
      setLongPressTriggered(true);
    }, delay);
  };

  const clear = (event) => {
    timeout.current && clearTimeout(timeout.current);
    if (!longPressTriggered && onClick) onClick();
    setLongPressTriggered(false);
    target.current = null;
  };

  return {
    onMouseDown: start, onTouchStart: start,
    onMouseUp: clear, onMouseLeave: clear, onTouchEnd: clear
  };
};

// --- COMPONENT: Draggable Tile ---
const SortableGlassTile = ({ id, icon, label, subtext, isActive, color, onToggle, onLongPress }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const longPressHandlers = useLongPress(onLongPress, onToggle);

  const activeClasses = isActive 
    ? "bg-white/90 text-gray-900 shadow-xl" 
    : "bg-white/10 text-white hover:bg-white/20";

  const glowMap = { red: "bg-red-500", yellow: "bg-amber-400", blue: "bg-blue-500", green: "bg-emerald-500" };

  return (
    <div 
      ref={setNodeRef} style={style} {...attributes} {...listeners} {...longPressHandlers}
      className={`relative group rounded-2xl p-5 border border-white/20 backdrop-blur-md h-48 flex flex-col justify-between cursor-grab active:cursor-grabbing touch-manipulation select-none overflow-hidden transition-colors duration-300 ${activeClasses}`}
    >
      {isActive && (
        <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${glowMap[color] || 'bg-white'} blur-3xl opacity-30 pointer-events-none`} />
      )}
      <div className="text-4xl filter drop-shadow-md">{icon}</div>
      <div>
        <h3 className="font-bold text-xl tracking-tight pointer-events-none">{label}</h3>
        <p className={`text-sm mt-1 font-medium truncate pointer-events-none ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
          {subtext}
        </p>
      </div>
    </div>
  );
};

// --- COMPONENT: Control Modal ---
const ControlModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl p-2">✕</button>
        <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
};

// --- MAIN APP ---
function App() {
  const { getEntity, callService, IDs, loading } = useHass();
  const [items, setItems] = useState(['caseta', 'ecobee', 'sony', 'alarm']);
  const [activeModal, setActiveModal] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading RTOUCH...</div>;

  const caseta = getEntity(IDs.CASETA);
  const ecobee = getEntity(IDs.ECOBEE);
  const sony = getEntity(IDs.SONY);
  const alarm = getEntity(IDs.ALARM);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const renderTile = (id) => {
    switch (id) {
      case 'caseta':
        const bri = caseta.attributes.brightness ? Math.round((caseta.attributes.brightness / 255) * 100) : 0;
        return <SortableGlassTile key={id} id={id} icon="💡" label="Lutron Caseta" color="yellow"
            isActive={caseta.state === 'on'} subtext={caseta.state === 'on' ? `${bri}%` : "Off"}
            onToggle={() => callService('light', 'toggle', { entity_id: IDs.CASETA })}
            onLongPress={() => setActiveModal('caseta')} />;
      case 'sony':
        const vol = sony.attributes.volume_level ? Math.round(sony.attributes.volume_level * 100) : 0;
        return <SortableGlassTile key={id} id={id} icon="🔊" label="Sony Atmos" color="blue"
            isActive={sony.state !== 'off' && sony.state !== 'unavailable'} subtext={sony.state !== 'off' ? `Vol ${vol}%` : "Standby"}
            onToggle={() => callService('media_player', 'toggle', { entity_id: IDs.SONY })}
            onLongPress={() => setActiveModal('sony')} />;
      case 'alarm':
        const isArmed = alarm.state !== 'disarmed';
        return <SortableGlassTile key={id} id={id} icon="🛡️" label="Security" color="red"
            isActive={isArmed} subtext={isArmed ? alarm.state : "Disarmed"}
            onToggle={() => isArmed ? callService('alarm_control_panel', 'alarm_disarm', { entity_id: IDs.ALARM, code: '1234' }) : callService('alarm_control_panel', 'alarm_arm_home', { entity_id: IDs.ALARM })}
            onLongPress={() => {}} />;
      case 'ecobee':
        return <SortableGlassTile key={id} id={id} icon="🌡️" label="Ecobee" color="green"
            isActive={ecobee.state !== 'off'} subtext={`${ecobee.attributes.current_temperature || '--'}°F`}
            onToggle={() => {}} onLongPress={() => setActiveModal('ecobee')} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-800 to-black p-6 font-sans">
      <header className="mb-8 select-none">
        <h1 className="text-4xl font-bold text-white">RTOUCH <span className="text-blue-500 text-sm">BETA 2</span></h1>
        <p className="text-gray-400 text-sm">Hold to Edit · Drag to Move</p>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {items.map((id) => renderTile(id))}
          </div>
        </SortableContext>
      </DndContext>

      {/* --- MODALS --- */}
      <ControlModal isOpen={activeModal === 'caseta'} onClose={() => setActiveModal(null)} title="Lights">
        <div className="flex flex-col gap-4">
          <label className="text-white text-sm">Brightness</label>
          <input type="range" min="0" max="100" className="w-full h-12 accent-amber-500"
            defaultValue={caseta.attributes.brightness ? Math.round((caseta.attributes.brightness / 255) * 100) : 0}
            onMouseUp={(e) => callService('light', 'turn_on', { entity_id: IDs.CASETA, brightness_pct: e.target.value })}
            onTouchEnd={(e) => callService('light', 'turn_on', { entity_id: IDs.CASETA, brightness_pct: e.target.value })} />
        </div>
      </ControlModal>

      <ControlModal isOpen={activeModal === 'sony'} onClose={() => setActiveModal(null)} title="Sony Receiver">
        <div className="flex flex-col gap-4">
          <label className="text-white text-sm">Volume</label>
          <input type="range" min="0" max="100" className="w-full h-12 accent-blue-500"
            defaultValue={sony.attributes.volume_level ? Math.round(sony.attributes.volume_level * 100) : 0}
            onMouseUp={(e) => callService('media_player', 'volume_set', { entity_id: IDs.SONY, volume_level: e.target.value / 100 })}
            onTouchEnd={(e) => callService('media_player', 'volume_set', { entity_id: IDs.SONY, volume_level: e.target.value / 100 })} />
        </div>
      </ControlModal>

      <ControlModal isOpen={activeModal === 'ecobee'} onClose={() => setActiveModal(null)} title="Thermostat">
        <div className="text-center text-white mb-4 text-5xl font-thin">{ecobee.attributes.current_temperature}°</div>
        <div className="flex gap-2">
            <button className="flex-1 py-3 bg-blue-500/20 text-blue-300 rounded-xl" onClick={() => callService('climate', 'set_hvac_mode', { entity_id: IDs.ECOBEE, hvac_mode: 'cool' })}>Cool</button>
            <button className="flex-1 py-3 bg-red-500/20 text-red-300 rounded-xl" onClick={() => callService('climate', 'set_hvac_mode', { entity_id: IDs.ECOBEE, hvac_mode: 'heat' })}>Heat</button>
        </div>
      </ControlModal>
    </div>
  );
}

export default App;
