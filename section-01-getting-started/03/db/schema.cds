namespace events;

entity Events {
    key ID        : UUID;
        title     : String(100);
        startDate : DateTime;
        endDate   : DateTime;
}
