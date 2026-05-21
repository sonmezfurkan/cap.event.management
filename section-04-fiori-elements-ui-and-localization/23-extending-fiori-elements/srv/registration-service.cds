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

    @Capabilities.InsertRestrictions.Insertable: false
    entity Registrations as projection on events.Registrations actions {
      action cancel();
    };

  // Unbound action — register for an event
  action register(
    @mandatory eventId   : UUID,
    @mandatory firstName : String(100),
    @mandatory lastName  : String(100),
    @mandatory email     : String(200)
  ) returns Registrations;

  // Unbound function — check event availability
  function checkAvailability(eventId : UUID) returns {
    available     : Boolean;
    totalSeats    : Integer;
    bookedSeats   : Integer;
    remainingSeats: Integer;
  };

  // Events — facts emitted after successful operations
  event RegistrationCreated : {
    registrationId   : UUID;
    eventId          : UUID;
    eventTitle       : String;
    email            : String;
    confirmationCode : String;
  };

  event RegistrationCancelled : {
    registrationId : UUID;
    eventId        : UUID;
    email          : String;
  };
}