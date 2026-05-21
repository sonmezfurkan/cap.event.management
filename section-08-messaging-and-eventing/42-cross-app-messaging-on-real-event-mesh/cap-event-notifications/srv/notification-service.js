const cds = require('@sap/cds')

module.exports = async function () {
  const messaging = await cds.connect.to('messaging')

  messaging.on('RegistrationService.RegistrationCreated', msg => {
    const { eventTitle, email, confirmationCode } = msg.data
    console.log(`[NOTIFY] New registration for "${eventTitle}"`)
  })

  messaging.on('RegistrationService.RegistrationCancelled', msg => {
    const { eventTitle, email, confirmationCode } = msg.data
    console.log(`[NOTIFY] Registration cancelled for event ${eventTitle}`)
  })

  messaging.on('AdminService.EventPublished', msg => {
    console.log(`[NOTIFY] Event "${msg.data.title}" is now live`)
  })

  messaging.on('AdminService.EventCancelled', msg => {
    console.log(`[NOTIFY] Event "${msg.data.title}" has been cancelled`)
  })
}