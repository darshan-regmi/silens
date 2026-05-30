export interface PoemNote {
  id: string;  // Notion page ID
  title: string;
  content: string;
  status: 'writing' | 'not published' | 'Published';
  createdAt: string;
  updatedAt: string;
}
const NOTION_AUTH_TOKEN = process.env.EXPO_PUBLIC_NOTION_API_TOKEN;
const NOTION_DATABASE_ID = process.env.EXPO_PUBLIC_NOTION_DATABASE_ID;
const NOTION_API_VERSION = process.env.EXPO_PUBLIC_NOTION_API_VERSION;
const NOTION_BASE_URL = process.env.EXPO_PUBLIC_NOTION_BASE_URL;

if (!NOTION_AUTH_TOKEN || !NOTION_DATABASE_ID || !NOTION_API_VERSION || !NOTION_BASE_URL) {
  throw new Error("❌ Missing required Notion environment variables");
}

const NOTION_QUERY_URL = `${NOTION_BASE_URL}/databases/${NOTION_DATABASE_ID}/query`;
const NOTION_PAGE_URL = `${NOTION_BASE_URL}/pages`;

const headers = {
  'Authorization': `Bearer ${NOTION_AUTH_TOKEN}`,
  'Notion-Version': NOTION_API_VERSION,
  'Content-Type': 'application/json',
};

const VALID_STATUSES = ['writing', 'not published', 'Published'] as const;

/* ─── Helpers ─────────────────────────────────────────────── */
function buildProperties(note: Omit<PoemNote, 'id' | 'createdAt' | 'updatedAt'>) {
  const safeStatus = VALID_STATUSES.includes(note.status) ? note.status : 'not published';

  return {
    Title: {
      title: [{ text: { content: note.title } }]
    },
    Content: {
      rich_text: [{ text: { content: note.content } }]
    },
    Status: {
      status: { name: safeStatus }
    }
  };
}

function parsePageToNote(page: any): PoemNote {
  const p = page.properties;
  // Notion's Status property is `.status.name`; older Select property is `.select.name` — handle both.
  const rawStatus = p.Status?.status?.name ?? p.Status?.select?.name ?? 'not published';
  return {
    id: page.id,
    title: p.Title?.title?.[0]?.text?.content ?? '',
    content: p.Content?.rich_text?.[0]?.text?.content ?? '',
    status: rawStatus as PoemNote['status'],
    createdAt: page.created_time,
    updatedAt: page.last_edited_time,
  };
}

/* ─── Fetch all poems (with pagination) ───────────────────── */
export const getNotesFromNotion = async (): Promise<PoemNote[]> => {
  const notes: PoemNote[] = [];
  let hasMore = true;
  let cursor: string | undefined = undefined;

  try {
    while (hasMore) {
      const res: Response = await fetch(NOTION_QUERY_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sorts: [{ property: 'UpdatedAt', direction: 'descending' }],
          start_cursor: cursor,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data: any = await res.json();

      const newNotes = data.results.map(parsePageToNote);
      notes.push(...newNotes);

      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    return notes;
  } catch (err) {
    console.error('Error loading notes from Notion:', err);
    return [];
  }
};

/* ─── Create ──────────────────────────────────────────────── */
export const createNoteInNotion = async (
  note: Omit<PoemNote, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PoemNote | null> => {
  try {
    if (!note.title && !note.content) {
      throw new Error("Note must have a title or content.");
    }

    const res: Response = await fetch(NOTION_PAGE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: buildProperties(note),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }

    const page: any = await res.json();

    if (!page.id) {
      console.warn('Unexpected response:', page);
      return null;
    }

    return {
      id: page.id,
      title: note.title,
      content: note.content,
      status: note.status ?? 'not published',
      createdAt: page.created_time,
      updatedAt: page.last_edited_time,
    };
  } catch (err) {
    console.error('Error creating note in Notion:', err);
    return null;
  }
};

/* ─── Update ──────────────────────────────────────────────── */
export const updateNoteInNotion = async (note: PoemNote): Promise<boolean> => {
  if (!note.id || note.id.trim() === '') {
    console.warn('❌ Invalid Notion page ID:', note.id);
    return false;
  }

  const url = `${NOTION_BASE_URL}/pages/${note.id}`;
  const body = {
    properties: buildProperties(note),
  };

  console.log('✏️ Updating Notion page:', url);
  console.log('📦 Request body:', JSON.stringify(body, null, 2));

  try {
    const res: Response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('⚠️ Notion update error:', errText);
      return false;
    }

    console.log('✅ Update successful for note ID:', note.id);
    return true;
  } catch (error) {
    console.error('🔥 Error updating note in Notion:', error);
    return false;
  }
};

/* ─── Delete (archive) ────────────────────────────────────── */
export const deleteNoteInNotion = async (pageId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${NOTION_PAGE_URL}/${pageId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ archived: true }),
    });

    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (err) {
    console.error('Error deleting note in Notion:', err);
    return false;
  }
};