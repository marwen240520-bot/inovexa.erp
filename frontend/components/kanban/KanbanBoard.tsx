"use client";
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export function KanbanBoard({ tasks, onTaskUpdate }) {
  const [columns, setColumns] = useState({
    todo: { title: 'À faire', items: tasks?.filter(t => t.status === 'todo') || [] },
    inProgress: { title: 'En cours', items: tasks?.filter(t => t.status === 'in_progress') || [] },
    review: { title: 'En révision', items: tasks?.filter(t => t.status === 'review') || [] },
    done: { title: 'Terminé', items: tasks?.filter(t => t.status === 'done') || [] }
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId) return;
    
    const sourceColumn = { ...columns[source.droppableId] };
    const destColumn = { ...columns[destination.droppableId] };
    const [movedItem] = sourceColumn.items.splice(source.index, 1);
    movedItem.status = destination.droppableId;
    destColumn.items.splice(destination.index, 0, movedItem);
    
    setColumns({
      ...columns,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn
    });
    
    onTaskUpdate(movedItem.id, destination.droppableId);
  };

  const columnColors = {
    todo: '#94a3b8',
    inProgress: '#f59e0b',
    review: '#667eea',
    done: '#10b981'
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        {Object.entries(columns).map(([key, column]) => (
          <div key={key} style={{ background: '#111', borderRadius: '20px', padding: '16px', border: '1px solid #222' }}>
            <h3 style={{ color: columnColors[key], marginBottom: '16px', fontWeight: 'bold' }}>
              {column.title} ({column.items.length})
            </h3>
            <Droppable droppableId={key}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: '300px' }}>
                  {column.items.map((item, index) => (
                    <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            background: '#1a1a1a',
                            borderRadius: '12px',
                            padding: '12px',
                            marginBottom: '12px',
                            border: '1px solid #333'
                          }}
                        >
                          <div style={{ color: 'white', fontWeight: '500' }}>{item.title}</div>
                          {item.description && (
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>{item.description}</div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
