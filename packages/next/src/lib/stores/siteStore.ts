import { create } from 'zustand';
import { Site } from '@/types/poc';
import { mockSites } from '@/lib/mockData';

interface SiteStore {
  sites: Site[];
  addSite: (site: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSite: (id: string, site: Partial<Site>) => void;
  deleteSite: (id: string) => void;
  getSite: (id: string) => Site | undefined;
  getSitesByProgram: (programId: string) => Site[];
  getActiveSites: () => Site[];
}

export const useSiteStore = create<SiteStore>((set, get) => ({
  sites: mockSites,

  addSite: (site) => {
    const now = new Date();
    const newSite: Site = {
      ...site,
      id: `SITE-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      sites: [...state.sites, newSite],
    }));
  },

  updateSite: (id, updates) => {
    set((state) => ({
      sites: state.sites.map((site) =>
        site.id === id ? { ...site, ...updates, updatedAt: new Date() } : site,
      ),
    }));
  },

  deleteSite: (id) => {
    set((state) => ({
      sites: state.sites.filter((site) => site.id !== id),
    }));
  },

  getSite: (id) => {
    return get().sites.find((site) => site.id === id);
  },

  getSitesByProgram: (programId) => {
    return get().sites.filter(
      (site) => site.programIds.includes(programId) && site.status === 'active',
    );
  },

  getActiveSites: () => {
    return get().sites.filter((site) => site.status === 'active');
  },
}));
