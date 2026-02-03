import { createContext, useContext, useState } from 'react';

const EntityActionContext = createContext();

export function EntityActionProvider({ children }) {
  const [action, setAction] = useState('list');
  const [onListClick, setOnListClick] = useState(null);

  return (
    <EntityActionContext.Provider value={{ action, setAction, onListClick, setOnListClick }}>
      {children}
    </EntityActionContext.Provider>
  );
}

export function useEntityAction() {
  return useContext(EntityActionContext);
}



