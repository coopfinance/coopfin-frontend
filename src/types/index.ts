export interface Notification {
  id: string;
  type: 'contribution' | 'loan' | 'vote' | 'distribution';
  description: string;
  timestamp: string;
  read: boolean;
}
