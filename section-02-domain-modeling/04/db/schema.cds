namespace events;

entity Events {
    key ID          : UUID;
        title       : String(150);
        description : String(5000);
        startDate   : DateTime;
        endDate     : DateTime;
        maxCapacity : Integer;
        status      : EventStatus;
}

entity Venues {
    key ID            : UUID;
        name          : String(150);
        city          : String(100);
        country       : String(100);
        streetAddress : String(200);
        postalCode    : String(20);
        capacity      : Integer;
}

type EventStatus: String enum {
    draft;
    published;
    cancelled;
    completed;
}
