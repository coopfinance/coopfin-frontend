import React from'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { useWallet } from '@creit.tech/stellar-wallets-kit';
import { Notification } from '@/types';
import { IconContribution, IconLoan, IconVote, IconDistribution } from 'lucide-react';

const getNotifications = async (wallet: string) => {
  const { data } = await axios.get<Notification[]>(`/api/notifications?recipient=${wallet}`);
  return data;
};

const markAllRead = async (notifications: Notification[]) => {
  const promises = notifications.map((notification) => 
    axios.patch(`/api/notifications/${notification.id}/read`)
  );
  await Promise.all(promises);
};

const RecentActivity: React.FC = () => {
  const { connectedWallet } = useWallet();

  const { data: notifications, isLoading } = useQuery(
    ['notifications', connectedWallet],
    () => getNotifications(connectedWallet || ''),
    {
      enabled:!!connectedWallet,
    }
  );

  const markAllReadMutation = useMutation(markAllRead, {
    onSuccess: () => {
      // Refetch notifications after marking all as read
      useQuery.refetchQueries('notifications');
    },
  });

  if (!connectedWallet) {
    return <div>Connect your wallet to see activity</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!notifications?.length) {
    return <div>No recent activity</div>;
  }

  const unreadNotifications = notifications.filter((n) =>!n.read);

  return (
    <div className="space-y-4">
      {unreadNotifications.length > 0 && (
        <button
          className="text-blue-500"
          onClick={() => markAllReadMutation.mutate(notifications)}
        >
          Mark all read
        </button>
      )}
      {notifications.map((notification) => (
        <div key={notification.id} className="flex items-center space-x-2 border-b border-gray-200 py-2">
          <div className="text-lg">
            {notification.type === 'contribution' && <IconContribution />}
            {notification.type === 'loan' && <IconLoan />}
            {notification.type === 'vote' && <IconVote />}
            {notification.type === 'distribution' && <IconDistribution />}
          </div>
          <div className="flex-1">
            <div>{notification.description}</div>
            <div className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;