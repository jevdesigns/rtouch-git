import { useState, useEffect } from 'react';

const DEFAULT_ENTITIES = {
    SONY: 'media_player.sony_str_dn1080',
    ALARM: 'alarm_control_panel.alarm_com',
    CASETA: 'light.lutron_caseta_dimmer',
    ECOBEE: 'climate.ecobee_thermostat',
};

const STORAGE_KEY = 'rtouch-entities';

const loadSavedEntities = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : DEFAULT_ENTITIES;
    } catch (e) {
        return DEFAULT_ENTITIES;
    }
};

const friendlyIncludes = (entity, ...keywords) => {
    const haystack = `${entity.entity_id} ${(entity.attributes?.friendly_name || '').toLowerCase()}`;
    return keywords.some((k) => haystack.includes(k));
};

const detectEntities = (stateMap) => {
    const entities = { ...DEFAULT_ENTITIES };
    const values = Object.values(stateMap);

    const findFirst = (predicate, fallback) => {
        const found = values.find(predicate);
        return found ? found.entity_id : fallback;
    };

    entities.SONY = findFirst(
        (e) => e.entity_id.startsWith('media_player.') && friendlyIncludes(e, 'sony', 'str', 'avr', 'receiver'),
        entities.SONY
    );

    entities.ALARM = findFirst(
        (e) => e.entity_id.startsWith('alarm_control_panel.'),
        entities.ALARM
    );

    entities.CASETA = findFirst(
        (e) => e.entity_id.startsWith('light.') && friendlyIncludes(e, 'lutron', 'caseta'),
        entities.CASETA
    );

    entities.ECOBEE = findFirst(
        (e) => e.entity_id.startsWith('climate.') && friendlyIncludes(e, 'ecobee'),
        entities.ECOBEE
    );

    return entities;
};

export const useHass = () => {
    const [states, setStates] = useState({});
    const [loading, setLoading] = useState(true);
    const [ids, setIds] = useState(loadSavedEntities());

    const fetchData = async () => {
        try {
            const res = await fetch('/api/states', { method: 'POST' });
            const data = await res.json();
            const stateMap = {};
            data.forEach((entity) => (stateMap[entity.entity_id] = entity));
            setStates(stateMap);
            const detected = detectEntities(stateMap);
            setIds((prev) => {
                const changed = Object.keys(prev).some((k) => prev[k] !== detected[k]);
                if (changed) {
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(detected));
                    } catch (e) {
                        // ignore storage failures (private browsing, etc.)
                    }
                    return detected;
                }
                return prev;
            });
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000); 
        return () => clearInterval(interval);
    }, []);

    const callService = async (domain, service, serviceData) => {
        await fetch('/api/service', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain, service, serviceData })
        });
        setTimeout(fetchData, 250); // Optimistic update
    };

    return {
        getEntity: (id) => states[id] || { state: 'unavailable', attributes: {} },
        callService,
        IDs: ids,
        loading
    };
};
