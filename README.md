# Swapcoin

## Interaction Flow

USER A requests swap, creates OFFER 1
USER A is prompted for payment for OFFER 1

USER A waits for USER B

USER B requests swap, creates OFFER 2
USER B is prompted for payment for OFFER 2

server detects there are 2 paid offers, OFFER 1 and OFFER 2
server checks for payment for OFFER 1 and OFFER 2
server creates RECEIPT 1 for OFFER 1
server creates RECEIPT 2 for OFFER 2
server creates TRANSACTION 1

server detects unpaid receipts
server looks up payment information based on RECEIPT `matchId` param
