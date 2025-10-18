import { Calendar, MapPin, Users, Clock } from "lucide-react";

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  status: "upcoming" | "ongoing" | "completed";
}

interface EventTableProps {
  events: Event[];
}

export function EventTable({ events }: EventTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
          <Calendar className="text-primary-accent" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-primary-fg">Talaash Events</h2>
          <p className="text-sm text-primary-muted">Upcoming and recent events</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="mx-auto text-primary-muted mb-3" size={48} />
          <p className="text-primary-muted">No events found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-primary-muted">Event</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-primary-muted">Date & Time</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-primary-muted">Location</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-primary-muted">Attendance</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-primary-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-primary-border hover:bg-primary-accent-light/30 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-primary-fg">{event.name}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-primary-muted" />
                      <div>
                        <p className="text-sm text-primary-fg">{formatDate(event.date)}</p>
                        <p className="text-xs text-primary-muted">{formatTime(event.date)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-primary-muted" />
                      <span className="text-sm text-primary-fg">{event.location}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-primary-muted" />
                      <div>
                        <p className="text-sm text-primary-fg">{event.attendees}/{event.maxAttendees}</p>
                        <div className="w-20 bg-border rounded-full h-1.5">
                          <div 
                            className="bg-primary-accent h-1.5 rounded-full" 
                            style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
