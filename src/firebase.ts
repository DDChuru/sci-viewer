import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';

// Firebase config for iClean project (client-side, read-only)
const firebaseConfig = {
  apiKey: "AIzaSyDFu5lMSuYjNPPKJAAFAZ3fqKLDk7L3kEE",
  authDomain: "iclean-field-service-4bddd.firebaseapp.com",
  projectId: "iclean-field-service-4bddd",
  storageBucket: "iclean-field-service-4bddd.appspot.com",
  messagingSenderId: "553598295957",
  appId: "1:553598295957:web:e66d0c2a7d8e6d6f5f5f5f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ACS Company ID
export const ACS_COMPANY_ID = 'AnmdYRpshMosqbsZ6l15';

// Types
export interface SCI {
  id: string;
  siteId: string;
  siteName: string;
  parentDocumentId: string;
  createdAt: string;
  updatedAt: string;
  section: {
    title: string;
    description?: string;
    sectionId: string;
    stepGroups: StepGroup[];
    chemicals?: Chemical[];
    frequency?: string;
    responsibility?: string;
    keyInspectionPoints?: string[];
    colourCodes?: ColourCode[];
    applicationEquipment?: string[];
    images?: Image[];
    documentMetadata?: DocumentMetadata;
  };
}

export interface StepGroup {
  title: string;
  description?: string;
  frequency?: string;
  steps: Step[];
}

export interface Step {
  order: number;
  label?: string;
  action: string;
  notes?: string[];
}

export interface Chemical {
  name: string;
  useRatio?: string;
  hotRatio?: string;
}

export interface ColourCode {
  colour: string;
  meaning: string;
}

export interface Image {
  caption?: string;
  pageNumber?: number;
  url?: string;
  storagePath?: string;
}

export interface DocumentMetadata {
  documentId?: string;
  title?: string;
  effectiveDate?: string;
  revision?: string;
  department?: string;
}

export interface Site {
  id: string;
  name: string;
  count: number;
}

// Fetch all SCIs for a site
export async function fetchSCIs(siteId?: string): Promise<SCI[]> {
  const collectionPath = `companies/${ACS_COMPANY_ID}/standard_cleaning_instructions`;
  const colRef = collection(db, collectionPath);

  let q;
  if (siteId) {
    q = query(colRef, where('siteId', '==', siteId));
  } else {
    q = query(colRef);
  }

  const snapshot = await getDocs(q);
  const scis: SCI[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as SCI));

  // Sort by title
  scis.sort((a, b) => (a.section?.title || '').localeCompare(b.section?.title || ''));

  return scis;
}

// Fetch sites that have SCIs
export async function fetchSitesWithSCIs(): Promise<Site[]> {
  const scis = await fetchSCIs();

  const siteMap = new Map<string, { name: string; count: number }>();

  for (const sci of scis) {
    const existing = siteMap.get(sci.siteId);
    if (existing) {
      existing.count++;
    } else {
      siteMap.set(sci.siteId, {
        name: sci.siteName || 'Unknown Site',
        count: 1
      });
    }
  }

  return Array.from(siteMap.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    count: data.count
  })).sort((a, b) => a.name.localeCompare(b.name));
}
