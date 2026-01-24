/**
 * ENTERPRISE APPEND-ONLY MERGE ENGINE
 * Strict logic to ensure new items never overwrite or delete existing ones.
 */

export const mergeAppendOnly = (existingArray, newItems, itemType = 'item') => {
  if (!Array.isArray(existingArray)) {
    console.error(`[Safety Shield] Existing ${itemType} is not an array.`);
    return existingArray;
  }
  if (!Array.isArray(newItems)) {
    console.warn(`[Safety Shield] New ${itemType}s must be an array.`);
    return existingArray;
  }

  // Detect duplicates based on key properties (path, id, or title)
  const existingKeys = new Set(existingArray.map(i => i.path || i.id || i.key || JSON.stringify(i)));
  
  const safeNewItems = newItems.filter(item => {
    const key = item.path || item.id || item.key || JSON.stringify(item);
    if (existingKeys.has(key)) {
      console.error(`[Safety Shield] BLOCKED OVERWRITE ATTEMPT: ${itemType} with key "${key}" already exists. Modification rejected.`);
      return false;
    }
    return true;
  });

  return [...existingArray, ...safeNewItems];
};

export const mergeObjectsSafe = (existingObj, newObj, objectName = 'config') => {
  const safeObj = { ...existingObj };
  
  Object.keys(newObj).forEach(key => {
    if (existingObj.hasOwnProperty(key)) {
      console.error(`[Safety Shield] BLOCKED OVERWRITE ATTEMPT: ${objectName} key "${key}" is protected.`);
    } else {
      safeObj[key] = newObj[key];
    }
  });
  
  return safeObj;
};
