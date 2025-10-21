import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock events data
    const events = [
      {
        id: "1",
        name: "Talaash Workshop 2024",
        date: "2024-02-15T10:00:00Z",
        location: "Main Conference Hall",
        attendees: 45,
        maxAttendees: 50,
        status: "upcoming"
      },
      {
        id: "2", 
        name: "Digital Marketing Masterclass",
        date: "2024-02-10T14:00:00Z",
        location: "Room 101",
        attendees: 30,
        maxAttendees: 30,
        status: "completed"
      },
      {
        id: "3",
        name: "Networking Event",
        date: "2024-02-08T18:00:00Z", 
        location: "Lobby Area",
        attendees: 25,
        maxAttendees: 40,
        status: "ongoing"
      },
      {
        id: "4",
        name: "Tech Innovation Summit",
        date: "2024-02-20T09:00:00Z",
        location: "Grand Ballroom",
        attendees: 0,
        maxAttendees: 100,
        status: "upcoming"
      },
      {
        id: "5",
        name: "Leadership Workshop",
        date: "2024-02-05T13:00:00Z",
        location: "Training Room A",
        attendees: 20,
        maxAttendees: 25,
        status: "completed"
      }
    ];

    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
