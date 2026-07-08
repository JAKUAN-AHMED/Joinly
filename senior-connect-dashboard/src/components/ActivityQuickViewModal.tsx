import { useNavigate } from 'react-router-dom';
import { Calendar, Tag } from 'lucide-react';
import Avatar from './Avatar';
import Modal from './Modal';

export interface ActivityQuickViewData {
  id?: string;
  activityName: string;
  category: string;
  organizer?: string;
  organizerPhoto?: string | null;
  dateTime?: string;
  location?: string;
  thumbnail?: string | null;
}

interface ActivityQuickViewModalProps {
  activity: ActivityQuickViewData | null;
  onClose: () => void;
}

/** Eye-icon quick view — shows key details, then links to the full Activity Details page. */
export default function ActivityQuickViewModal({ activity, onClose }: ActivityQuickViewModalProps) {
  const navigate = useNavigate();

  return (
    <Modal isOpen={!!activity} onClose={onClose} title="Activity Details">
      {activity && (
        <div className="space-y-4">
          {activity.thumbnail && (
            <div className="overflow-hidden rounded-xl">
              <img src={activity.thumbnail} alt={activity.activityName} className="h-36 w-full object-cover" />
            </div>
          )}
          <div>
            <h3 className="font-heading text-base font-bold text-ink">{activity.activityName}</h3>
            {activity.location && <p className="mt-1 text-sm text-muted">{activity.location}</p>}
          </div>

          <div className="space-y-2 text-sm text-body">
            <div className="flex items-center gap-2">
              <Tag size={15} className="text-primary" />
              {activity.category}
            </div>
            {activity.organizer && (
              <div className="flex items-center gap-2">
                <Avatar src={activity.organizerPhoto} name={activity.organizer} size={20} />
                Organizer: {activity.organizer}
              </div>
            )}
            {activity.dateTime && (
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-primary" />
                {activity.dateTime}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-line py-2.5 text-sm font-semibold text-body hover:bg-page"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => navigate(activity.id ? `/activities/${activity.id}` : '/activities')}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
            >
              View Full Details
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
