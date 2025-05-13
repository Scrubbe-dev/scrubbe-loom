'use client';

import { Draggable, Droppable } from '@hello-pangea/dnd';
import type { DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';

interface IncidentColumnProps {
  status: string;
  incidents: Array<{
    id: string;
    title: string;
    severity: number;
    status: string;
  }>;
}

export function IncidentColumn({ status, incidents }: IncidentColumnProps) {
  return (
    <div className="w-80 bg-muted p-4 rounded-lg shadow-sm">
      <h3 className="font-bold mb-4 text-lg capitalize">{status.toLowerCase()}</h3>
      <Droppable droppableId={status}>
        {(provided: DroppableProvided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {incidents.map((incident, index) => (
              <Draggable
                key={incident.id}
                draggableId={incident.id}
                index={index}
              >
                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`p-3 rounded-lg bg-background shadow transition-colors ${
                      snapshot.isDragging ? 'bg-blue-50 dark:bg-blue-900' : ''
                    }`}
                    style={provided.draggableProps.style}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{incident.title}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        incident.severity > 3
                           ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                      }`}>
                        Severity {incident.severity}
                      </span>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}