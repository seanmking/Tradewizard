import React from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot
} from 'react-beautiful-dnd';

// Interface definitions
interface CustomDragDropContextProps {
  onDragEnd: (result: DropResult) => void;
  children: React.ReactNode;
}

interface CustomDroppableProps {
  droppableId: string;
  children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactElement;
  type?: string;
  direction?: 'vertical' | 'horizontal';
  ignoreContainerClipping?: boolean;
  isDropDisabled?: boolean;
  isCombineEnabled?: boolean;
  mode?: 'standard' | 'virtual';
}

interface CustomDraggableProps {
  draggableId: string;
  index: number;
  children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactElement;
  isDragDisabled?: boolean;
  disableInteractiveElementBlocking?: boolean;
  shouldRespectForcePress?: boolean;
}

// Custom wrapper for DragDropContext
export const CustomDragDropContext = ({ onDragEnd, children }: CustomDragDropContextProps) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {children}
    </DragDropContext>
  );
};

// Custom wrapper for Droppable
export const CustomDroppable = ({ 
  droppableId, 
  children, 
  type = 'DEFAULT', 
  direction = 'vertical',
  ignoreContainerClipping = false,
  isDropDisabled = false,
  isCombineEnabled = false,
  mode = 'standard'
}: CustomDroppableProps) => {
  return (
    <Droppable 
      droppableId={droppableId}
      type={type}
      direction={direction}
      ignoreContainerClipping={ignoreContainerClipping}
      isDropDisabled={isDropDisabled}
      isCombineEnabled={isCombineEnabled}
      mode={mode}
    >
      {children}
    </Droppable>
  );
};

// Custom wrapper for Draggable
export const CustomDraggable = ({
  draggableId,
  index,
  children,
  isDragDisabled = false,
  disableInteractiveElementBlocking = false,
  shouldRespectForcePress = true
}: CustomDraggableProps) => {
  // Log the draggableId for debugging
  React.useEffect(() => {
    console.log(`Draggable component mounted with ID: ${draggableId}`);
  }, [draggableId]);

  return (
    <Draggable
      draggableId={draggableId}
      index={index}
      isDragDisabled={isDragDisabled}
      disableInteractiveElementBlocking={disableInteractiveElementBlocking}
      shouldRespectForcePress={shouldRespectForcePress}
    >
      {children}
    </Draggable>
  );
}; 