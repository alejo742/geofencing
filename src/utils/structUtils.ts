import { Structure, StructureType, StructureHierarchy, StructureRelationship } from '../types';

function capitalizeStructureType(type?: StructureType): string {
  if (!type) return '';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Utility functions for hierarchy management
function buildStructureHierarchy(structures: Structure[]): StructureHierarchy[] {
  const structureMap = new Map<string, Structure>();
  const childrenMap = new Map<string, Structure[]>();
  
  // Build maps
  structures.forEach(structure => {
    structureMap.set(structure.code, structure);
    if (!childrenMap.has(structure.code)) {
      childrenMap.set(structure.code, []);
    }
    
    if (structure.parentId) {
      if (!childrenMap.has(structure.parentId)) {
        childrenMap.set(structure.parentId, []);
      }
      childrenMap.get(structure.parentId)!.push(structure);
    }
  });
  
  // Build hierarchy starting from root nodes
  function buildNode(structure: Structure, depth: number = 0): StructureHierarchy {
    const children = childrenMap.get(structure.code) || [];
    return {
      structure,
      children: children.map(child => buildNode(child, depth + 1)),
      depth
    };
  }
  
  // Return only root nodes (structures without parents)
  return structures
    .filter(s => !s.parentId)
    .map(s => buildNode(s));
}

function getStructureRelationships(structureCode: string, structures: Structure[]): StructureRelationship {
  const structure = structures.find(s => s.code === structureCode);
  if (!structure) {
    return {
      parent: null,
      children: [],
      siblings: [],
      ancestors: [],
      descendants: []
    };
  }
  
  const parent = structure.parentId ? structures.find(s => s.code === structure.parentId) || null : null;
  const children = structures.filter(s => s.parentId === structureCode);
  const siblings = parent ? structures.filter(s => s.parentId === parent.code && s.code !== structureCode) : [];
  
  // Get all ancestors
  const ancestors: Structure[] = [];
  let currentParent = parent;
  while (currentParent) {
    ancestors.push(currentParent);
    currentParent = currentParent.parentId ? structures.find(s => s.code === currentParent!.parentId) || null : null;
  }
  
  // Get all descendants
  const descendants: Structure[] = [];
  function collectDescendants(parentCode: string) {
    const directChildren = structures.filter(s => s.parentId === parentCode);
    directChildren.forEach(child => {
      descendants.push(child);
      collectDescendants(child.code);
    });
  }
  collectDescendants(structureCode);
  
  return {
    parent,
    children,
    siblings,
    ancestors,
    descendants
  };
}

function canSetParent(childCode: string, parentCode: string, structures: Structure[]): boolean {
  if (childCode === parentCode) return false; // Can't be parent of itself
  
  const relationships = getStructureRelationships(parentCode, structures);
  // Check if child is already an ancestor of the proposed parent (would create cycle)
  return !relationships.ancestors.some(ancestor => ancestor.code === childCode) &&
         !relationships.descendants.some(descendant => descendant.code === childCode);
}

export { 
  capitalizeStructureType,
  buildStructureHierarchy,
  getStructureRelationships,
  canSetParent
};