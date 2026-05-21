using {events} from '../db/schema';

service RegistrationService {
    @readonly entity Events as projection on events.Events {
        ID,
        title,
        description,
        startDate,
        endDate,
        maxCapacity,
        status,
        venue
    };
    @readonly entity Venues as projection on events.Venues;
    entity Registrations as projection on events.Registrations actions {
      action cancel();
    };

  // Unbound action — register for an event
  action register(
    eventId   : UUID,
    firstName : String(100),
    lastName  : String(100),
    email     : String(200)
  ) returns Registrations;

  // Unbound function — check event availability
  function checkAvailability(eventId : UUID) returns {
    available     : Boolean;
    totalSeats    : Integer;
    bookedSeats   : Integer;
    remainingSeats: Integer;
  };
}