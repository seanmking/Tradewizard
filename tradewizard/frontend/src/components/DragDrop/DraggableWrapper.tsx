import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// Custom wrapper for DragDropContext to handle default props
export const CustomDragDropContext: React.FC<{
  onDragEnd: (result: DropResult) => void;
  children: React.ReactNode;
}> = ({ onDragEnd, children }) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {children}
    </DragDropContext>
  );
};

// Custom wrapper for Droppable to handle default props
export const CustomDroppable: React.FC<{
  droppableId: string;
  children: any;
  type?: string;
  direction?: 'vertical' | 'horizontal';
  ignoreContainerClipping?: boolean;
  isDropDisabled?: boolean;
  isCombineEnabled?: boolean;
  mode?: 'standard' | 'virtual';
}> = ({ 
  droppableId, 
  children, 
  type = 'DEFAULT', 
  direction = 'vertical',
  ignoreContainerClipping = false,
  isDropDisabled = false,
  isCombineEnabled = false,
  mode = 'standard'
}) => {
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

// Custom wrapper for Draggable to handle default props
export const CustomDraggable: React.FC<{
  draggableId: string;
  index: number;
  children: any;
  isDragDisabled?: boolean;
  disableInteractiveElementBlocking?: boolean;
  shouldRespectForcePress?: boolean;
}> = ({
  draggableId,
  index,
  children,
  isDragDisabled = false,
  disableInteractiveElementBlocking = false,
  shouldRespectForcePress = true
}) => {
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