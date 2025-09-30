/**
 * Geofencing Service
 * Handles geofencing saving logic and Firebase interactions.
 */

import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Structure } from '@/types';

/**
 * Save or update a structure in the database.
 * @param structure The structure to save or update.
 */
export async function saveStructure(structure: Structure) {
  const structureRef = doc(db, 'structures', structure.code);
  await setDoc(structureRef, structure);
}

/**
 * Save or update multiple structures in the database.
 * @param structures The array of structures to save or update.
 * @returns A promise that resolves when all structures have been saved.
 */
export async function saveStructures(structures: Structure[]) {
  const promises = structures.map(structure => saveStructure(structure));
  await Promise.all(promises);
}

/**
 * Delete a structure from the database.
 * @param code The unique code of the structure to delete.
 */
export async function deleteStructure(code: string) {
  const structureRef = doc(db, 'structures', code);
  await deleteDoc(structureRef);
}