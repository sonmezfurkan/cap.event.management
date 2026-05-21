namespace events;

using {
    cuid,
    managed,
    Country,
    sap.common.CodeList
} from '@sap/cds/common';

entity Events : cuid, managed {
    title                  : String(150);
    description            : String(5000);
    startDate              : DateTime;
    endDate                : DateTime;
    maxCapacity            : Integer;
    status                 : EventStatus default 'draft';
    venue                  : Association to Venues;
    sessions               : Composition of many Sessions
                                 on sessions.event = $self;
    registrations          : Composition of many Registrations
                                 on registrations.event = $self;
    virtual attendeeCount  : Integer;
    virtual seatsRemaining : Integer;
}

entity Venues : cuid, managed {
    name          : String(150);
    city          : String(100);
    country       : Country;
    streetAddress : String(200);
    postalCode    : String(20);
    capacity      : Integer;
    events        : Association to many Events
                        on events.venue = $self;
}

entity Sessions : cuid, managed {
    title       : String(200);
    description : String(2000);
    startTime   : DateTime;
    endTime     : DateTime;
    maxCapacity : Integer;
    event       : Association to Events;
    speakers    : Association to many Sessions_Speakers
                      on speakers.session = $self;
}

entity Speakers : cuid, managed {
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

entity Registrations : cuid, managed {
    @mandatory event     : Association to Events;
    @mandatory firstName : String(100);
    @mandatory lastName  : String(100);
    @mandatory email     : String(200);
    confirmationCode     : String(20);
    status               : RegistrationStatus default 'confirmed';
}

entity EventStatuses : CodeList {
    key code: EventStatus
}

type EventStatus        : String enum {
    draft;
    published;
    cancelled;
    completed;
}

type RegistrationStatus : String enum {
    confirmed;
    cancelled;
    waitlisted;
}
