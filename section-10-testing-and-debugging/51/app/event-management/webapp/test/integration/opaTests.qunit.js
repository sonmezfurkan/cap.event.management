sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'app/events/eventmanagement/test/integration/FirstJourney',
		'app/events/eventmanagement/test/integration/pages/EventsList',
		'app/events/eventmanagement/test/integration/pages/EventsObjectPage'
    ],
    function(JourneyRunner, opaJourney, EventsList, EventsObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('app/events/eventmanagement') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheEventsList: EventsList,
					onTheEventsObjectPage: EventsObjectPage
                }
            },
            opaJourney.run
        );
    }
);