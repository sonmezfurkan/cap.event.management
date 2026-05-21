namespace events;

entity Events {
    key ID          : UUID;
        title       : String(150);
        description : String(5000);
        startDate   : DateTime;
        endDate     : DateTime;
        maxCapacity : Integer;
        status      : EventStatus;
        venue       : Association to Venues;
        sessions    : Composition of many Sessions
                          on sessions.event = $self;
}

entity Venues {
    key ID            : UUID;
        name          : String(150);
        city          : String(100);
        country       : String(100);
        streetAddress : String(200);
        postalCode    : String(20);
        capacity      : Integer;
        events        : Association to many Events
                            on events.venue = $self;
}

entity Sessions {
    key ID          : UUID;
        title       : String(200);
        description : String(2000);
        startTime   : DateTime;
        endTime     : DateTime;
        maxCapacity : Integer;
        event       : Association to Events;
        speakers    : Association to many Sessions_Speakers
                          on speakers.session = $self;
}

entity Speakers {
    key ID        : UUID;
        firstName : String(100);
        lastName  : String(100);
        email     : String(200);
        bio       : String(2000);
        sessions  : Association to many Sessions_Speakers
                        on sessions.speaker = $self;
}

entity Sessions_Speakers {
    key session : Association to Sessions;
    key speaker : Association to Speakers;
}

type EventStatus : String enum {
    draft;
    published;
    cancelled;
    completed;
}
