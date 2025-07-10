'use client';

import StructureList from '@/components/StructureList';
import NewStructureForm from '@/components/NewStructureForm';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <aside className="w-full md:w-64 border-r border-gray-200 flex flex-col">
        <div className="p-4">
          <NewStructureForm />
          <StructureList />
        </div>
      </aside>
      
      <section className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="mb-2">Map will be displayed here in Phase 2</p>
          <p className="text-sm">Select or create a structure to get started</p>
        </div>
      </section>
    </>
  );
}