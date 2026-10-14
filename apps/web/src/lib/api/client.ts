import { ApiResponse } from '@/lib/types';

// FORCE MOCK MODE
// unused: const USE_MOCKS = true;

export class ApiClient {
  constructor() {
    console.log('🔧 ApiClient constructed');
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    console.log('📡 Request:', path, options.method || 'GET');
    return this.mockRequest<T>(path, options);
  }

  private async mockRequest<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    console.log('📦 Mock request for:', path);
    
    try {
      const { mockData } = await import('@/data/mockData');
      await new Promise(resolve => setTimeout(resolve, 300));

      // ============================================
      // VENTURES
      // ============================================
      if (path === '/ventures' && options.method === 'GET') {
        return { data: mockData.ventures as T };
      }
      if (path.startsWith('/ventures/') && options.method === 'GET') {
        const id = path.split('/')[2];
        const venture = mockData.ventures.find((v: any) => v.id === id);
        return { data: venture as T };
      }

      // ============================================
      // IDEAS
      // ============================================
      if (path === '/ideas' && options.method === 'GET') {
        return { data: mockData.ideas as T };
      }
      if (path.startsWith('/ideas/') && options.method === 'GET') {
        const id = path.split('/')[2];
        const idea = mockData.ideas.find((i: any) => i.id === id);
        return { data: idea as T };
      }
      if (path === '/ideas' && options.method === 'POST') {
        const body = JSON.parse(options.body as string || '{}');
        const newIdea = {
          id: `idea_${Date.now()}`,
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          progress: 0,
          context: { evidence: [], knowledge: [], artifacts: [], checkpoints: [] }
        };
        return { data: newIdea as T };
      }

      // ============================================
      // AGENTS
      // ============================================
      if (path === '/agents' && options.method === 'GET') {
        return { data: mockData.agents as T };
      }
      if (path.startsWith('/agents/') && options.method === 'GET') {
        const id = path.split('/')[2];
        const agent = mockData.agents.find((a: any) => a.id === id);
        return { data: agent as T };
      }

      // ============================================
      // CHECKPOINTS
      // ============================================
      if (path === '/checkpoints' && options.method === 'GET') {
        return { data: mockData.checkpoints as T };
      }
      if (path === '/checkpoints/pending' && options.method === 'GET') {
        const pending = mockData.checkpoints.filter((c: any) => c.status === 'pending');
        return { data: pending as T };
      }
      if (path.startsWith('/checkpoints/') && options.method === 'POST') {
        const id = path.split('/')[2];
        const checkpoint = mockData.checkpoints.find((c: any) => c.id === id);
        if (checkpoint) {
          const body = JSON.parse(options.body as string || '{}');
          return { data: { ...checkpoint, status: 'resolved', resolvedChoice: body.choice, resolvedAt: new Date().toISOString() } as T };
        }
        return { data: null as T };
      }

      // ============================================
      // OUTCOMES
      // ============================================
      if (path === '/outcomes' && options.method === 'GET') {
        return { data: mockData.outcomes as T };
      }
      if (path.startsWith('/outcomes/') && options.method === 'GET') {
        const id = path.split('/')[2];
        const outcome = mockData.outcomes.find((o: any) => o.id === id);
        return { data: outcome as T };
      }

      // ============================================
      // LIBRARY (Knowledge)
      // ============================================
      if (path === '/library' && options.method === 'GET') {
        return { data: mockData.knowledge as T };
      }

      // ============================================
      // EVENTS
      // ============================================
      if (path === '/events' && options.method === 'GET') {
        return { data: mockData.events as T };
      }

      // ============================================
      // PULSE
      // ============================================
      if (path === '/pulse' && options.method === 'GET') {
        return { data: mockData.pulse as T };
      }

      // ============================================
      // CAMPAIGNS
      // ============================================
      if (path === '/campaigns' && options.method === 'GET') {
        return { data: mockData.campaigns as T };
      }
      if (path.startsWith('/campaigns/') && options.method === 'GET') {
        const id = path.split('/')[2];
        const campaign = mockData.campaigns.find((c: any) => c.id === id);
        return { data: campaign as T };
      }

      // ============================================
      // DASHBOARD STATS
      // ============================================
      if (path === '/dashboard/stats' && options.method === 'GET') {
        return { data: mockData.dashboardStats as T };
      }

      // ============================================
      // VENTURE FUNCTION ENDPOINTS (GTM, Sales, Growth, Analytics, Knowledge)
      // ============================================
      if (path.includes('/gtm') && options.method === 'GET') {
        const ventureId = path.split('/')[2];
        const venture = mockData.ventures.find((v: any) => v.id === ventureId);
        return { data: (venture?.functions?.gtm ?? null) as T };
      }
      if (path.includes('/sales') && options.method === 'GET') {
        const ventureId = path.split('/')[2];
        const venture = mockData.ventures.find((v: any) => v.id === ventureId);
        return { data: (venture?.functions?.sales ?? null) as T };
      }
      if (path.includes('/growth') && options.method === 'GET') {
        const ventureId = path.split('/')[2];
        const venture = mockData.ventures.find((v: any) => v.id === ventureId);
        return { data: (venture?.functions?.growth ?? null) as T };
      }
      if (path.includes('/analytics') && options.method === 'GET') {
        const ventureId = path.split('/')[2];
        const venture = mockData.ventures.find((v: any) => v.id === ventureId);
        return { data: (venture?.functions?.analytics ?? null) as T };
      }
      if (path.includes('/knowledge') && options.method === 'GET') {
        const ventureId = path.split('/')[2];
        const venture = mockData.ventures.find((v: any) => v.id === ventureId);
        return { data: (venture?.functions as any)?.knowledge ?? (null as T) };
      }

      console.warn('⚠️ No mock found for path:', path);
      return { data: null as T };
    } catch (error) {
      console.error('❌ Error in mockRequest:', error);
      return { data: null as T };
    }
  }

  // ============================================
  // PUBLIC METHODS
  // ============================================
  async get<T>(
    path: string,
    params?: Record<string, string | undefined>
  ): Promise<ApiResponse<T>> {
    const query = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).filter(
            ([, v]) => v !== undefined
          ) as [string, string][]
        ).toString()
      : '';
    return this.request<T>(path + query, { method: 'GET' });
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
