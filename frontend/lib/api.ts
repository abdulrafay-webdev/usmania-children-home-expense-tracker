export interface Entry {
  id: number;
  person_id: number;
  item_name: string;
  quantity: number;
  item_quality?: string | null;
  price: number;
  line_total: number;
  note?: string | null;
  created_at: string;
}

export interface Person {
  id: number;
  name: string;
  contact?: string | null;
  total_amount_given: number;
  created_at: string;
  total_spent: number;
  remaining_balance: number;
  entries_count: number;
}

export interface PersonDetail extends Person {
  entries: Entry[];
}

export interface RecentEntry extends Entry {
  person_name: string;
}

export interface DashboardSummary {
  total_persons: number;
  total_amount_collected: number;
  total_spent: number;
  total_remaining: number;
  recent_entries: RecentEntry[];
  recent_persons: Person[];
}

export interface CreatePersonPayload {
  name: string;
  contact?: string;
  total_amount_given: number;
}

export interface UpdatePersonPayload {
  name?: string;
  contact?: string;
  total_amount_given?: number;
}

export interface CreateEntryPayload {
  item_name: string;
  quantity: number;
  item_quality?: string;
  price: number;
  note?: string;
}

export interface UpdateEntryPayload {
  item_name?: string;
  quantity?: number;
  item_quality?: string;
  price?: number;
  note?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new Error(`Failed to connect to backend server at ${API_BASE_URL}. Please ensure the FastAPI backend is running. (${message})`);
  }

  if (!response.ok) {
    let errorDetail = `Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        if (Array.isArray(errorJson.detail)) {
          errorDetail = errorJson.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(", ");
        } else {
          errorDetail = String(errorJson.detail);
        }
      }
    } catch {
      // response wasn't json, use statusText
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Dashboard
  getDashboardSummary: (): Promise<DashboardSummary> => fetchJson<DashboardSummary>("/summary"),

  // Persons
  getPersons: (search?: string): Promise<Person[]> => {
    const query = search ? `?search=${encodeURIComponent(search.trim())}` : "";
    return fetchJson<Person[]>(`/persons${query}`);
  },

  getPerson: (id: number): Promise<PersonDetail> => fetchJson<PersonDetail>(`/persons/${id}`),

  createPerson: (payload: CreatePersonPayload): Promise<Person> =>
    fetchJson<Person>("/persons", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updatePerson: (id: number, payload: UpdatePersonPayload): Promise<Person> =>
    fetchJson<Person>(`/persons/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deletePerson: (id: number): Promise<{ message: string }> =>
    fetchJson<{ message: string }>(`/persons/${id}`, {
      method: "DELETE",
    }),

  // Entries
  createEntry: (personId: number, payload: CreateEntryPayload): Promise<Entry> =>
    fetchJson<Entry>(`/persons/${personId}/entries`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateEntry: (entryId: number, payload: UpdateEntryPayload): Promise<Entry> =>
    fetchJson<Entry>(`/entries/${entryId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteEntry: (entryId: number): Promise<{ message: string }> =>
    fetchJson<{ message: string }>(`/entries/${entryId}`, {
      method: "DELETE",
    }),

  // PDF
  getPdfDownloadUrl: (personId: number): string => `${API_BASE_URL}/persons/${personId}/pdf`,

  downloadPdf: async (personId: number, personName: string): Promise<void> => {
    const url = `${API_BASE_URL}/persons/${personId}/pdf`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to generate PDF: ${response.statusText}`);
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    const cleanName = personName.replace(/[^a-zA-Z0-9_-]/g, "_");
    a.download = `Usmania_Children_Home_Balance_Statement_${cleanName}_ID${personId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  },
};

export function formatCurrency(amount: number): string {
  return "Rs. " + (amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateString: string): string {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}
