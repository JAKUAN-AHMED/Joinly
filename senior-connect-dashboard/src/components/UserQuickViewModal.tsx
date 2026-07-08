import { useNavigate } from 'react-router-dom';
import { Globe2, ListChecks } from 'lucide-react';
import Avatar from './Avatar';
import Modal from './Modal';
import StatusBadge from './StatusBadge';

export interface UserQuickViewData {
  id: string;
  name: string;
  email: string;
  country: string | null;
  activities: number;
  status: string;
  profilePhoto: string | null;
}

interface UserQuickViewModalProps {
  user: UserQuickViewData | null;
  onClose: () => void;
}

/** Eye-icon quick view — shows key details, then links to the full User Details page. */
export default function UserQuickViewModal({ user, onClose }: UserQuickViewModalProps) {
  const navigate = useNavigate();

  return (
    <Modal isOpen={!!user} onClose={onClose} title="User Details">
      {user && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar src={user.profilePhoto} name={user.name} size={48} />
            <div>
              <h3 className="font-heading text-base font-bold text-ink">{user.name}</h3>
              <p className="text-sm text-muted">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-body">
            <div className="flex items-center gap-2">
              <Globe2 size={15} className="text-primary" />
              {user.country ?? 'Unknown country'}
            </div>
            <div className="flex items-center gap-2">
              <ListChecks size={15} className="text-primary" />
              {user.activities} activities
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={user.status} />
            </div>
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
              onClick={() => navigate(`/users/${user.id}`)}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
            >
              View Full Profile
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
