// Create this as a separate utility file for reusable drag-and-drop functionality

export const getDragAfterElement = (container, y) => {
    const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  };
  
  export const calculateDropPosition = (e, container) => {
    const y = e.clientY;
    const afterElement = getDragAfterElement(container, y);
    
    if (afterElement == null) {
      return { position: 'end', afterTaskId: null };
    } else {
      return { 
        position: 'before', 
        afterTaskId: afterElement.id.replace('task-', '') 
      };
    }
  };
  
  export const createPlaceholder = () => {
    const placeholder = document.createElement('div');
    placeholder.className = 'border-2 border-dashed border-blue-400 rounded-md h-16 mb-3';
    placeholder.id = 'drag-placeholder';
    return placeholder;
  };
  
  export const removePlaceholder = () => {
    const placeholder = document.getElementById('drag-placeholder');
    if (placeholder) placeholder.remove();
  };
  
  export const highlightColumn = (columnElement, highlight) => {
    if (highlight) {
      columnElement.classList.add('bg-blue-50', 'border-blue-200');
    } else {
      columnElement.classList.remove('bg-blue-50', 'border-blue-200');
    }
  };