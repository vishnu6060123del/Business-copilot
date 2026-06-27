export interface ChatHistoryRecord {
  userId: string;
  timestamp: string;
  query: string;
  response: unknown;
}

type GlobalWithChatStore = typeof globalThis & {
  __procurementChatHistory?: ChatHistoryRecord[];
};

const globalStore = globalThis as GlobalWithChatStore;

function store() {
  if (!globalStore.__procurementChatHistory) {
    globalStore.__procurementChatHistory = [];
  }
  return globalStore.__procurementChatHistory;
}

export async function saveChatHistory(record: Omit<ChatHistoryRecord, "timestamp">) {
  const item: ChatHistoryRecord = {
    ...record,
    timestamp: new Date().toISOString(),
  };
  store().push(item);
  return item;
}

export async function getChatHistory(userId: string) {
  return store()
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export const dynamoDbShape = {
  tableName: "ProcurementChatHistory",
  partitionKey: "userId",
  sortKey: "timestamp",
  attributes: ["query", "response"],
};