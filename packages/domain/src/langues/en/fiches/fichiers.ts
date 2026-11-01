import type { Fiche } from '../../../fiches/fiche.ts';

/** Fiches « En savoir plus » de la famille Fichiers & Batch en anglais, par numéro de carte (ADR 0036, US-081). */
export const FICHES_FICHIERS_EN: Readonly<Record<number, Fiche>> = {
  1: {
    definition:
      'File Transfer Protocol: the historic protocol, standardised as early as the 1970s (RFC 959 in 1985), for copying files from one machine to another.',
    usage:
      'Dropping or fetching files on a server: nightly exports, exchanges with a partner, bulk loads. Simple and available everywhere, it was long the quickest way to make two systems talk.',
    exemple:
      'Every evening a partner drops orders.csv on the FTP server; at 2 a.m. a batch job fetches it and loads it into the ERP.',
    aRetenir:
      'FTP encrypts nothing: username, password and content travel in plain text over the network. And a dropped file says neither whether it is complete nor whether it has already been processed.',
    liens: [
      {
        titre: 'File Transfer Protocol',
        url: 'https://en.wikipedia.org/wiki/File_Transfer_Protocol',
        langue: 'en',
      },
      {
        titre: 'RFC 959: File Transfer Protocol',
        url: 'https://www.rfc-editor.org/rfc/rfc959.html',
        langue: 'en',
      },
    ],
  },
  2: {
    definition:
      'SSH File Transfer Protocol: file transfer over an encrypted SSH connection. Despite its name, it is not secure FTP (that is FTPS) but a different protocol.',
    usage:
      'Exchanging files with a partner or between servers without exposing passwords or content: the connection is encrypted, and you authenticate with a password or, better, an SSH key.',
    exemple:
      'Every morning a bank makes a statement available on its SFTP server; the treasury job connects with its key and downloads it.',
    aRetenir:
      'Encryption protects the transport, not the rest: a file can still arrive incomplete, twice or late. And keys need managing: one per partner, renewed, revoked when the partner leaves.',
    liens: [
      {
        titre: 'SSH File Transfer Protocol',
        url: 'https://en.wikipedia.org/wiki/SSH_File_Transfer_Protocol',
        langue: 'en',
      },
      { titre: 'sftp(1), OpenBSD manual', url: 'https://man.openbsd.org/sftp', langue: 'en' },
    ],
  },
  3: {
    definition:
      'Electronic data interchange: business documents (orders, invoices, shipping notices) sent from computer to computer in a standard format, such as EDIFACT or X12.',
    usage:
      'Automating exchanges with customers, suppliers and carriers: every partner understands the same message, with no re-keying and no paper. A practice born in the 1970s, still at the heart of B2B trade.',
    exemple:
      'A customer sends an EDIFACT ORDERS message; it is translated, the order is created, then an ORDRSP message goes out to confirm it and a DESADV announces the shipment.',
    aRetenir:
      'A standard does not prevent variants: each partner has its own implementation guide. Document your messages and test with every new partner before going live.',
    liens: [
      {
        titre: 'Electronic data interchange',
        url: 'https://en.wikipedia.org/wiki/Electronic_data_interchange',
        langue: 'en',
      },
      { titre: 'EDIFACT', url: 'https://en.wikipedia.org/wiki/EDIFACT', langue: 'en' },
    ],
  },
  4: {
    definition:
      'Comma-Separated Values: a text file where each line is a record and each field is separated by a comma… or a semicolon, or a tab.',
    usage:
      'The simplest exchange format: spreadsheet exports, bulk loads, database extracts, partner files. Readable by a human as well as a machine.',
    exemple:
      'A spreadsheet set to French exports with semicolons, because the comma is the decimal separator (1,5); the program expecting commas splits lines in the middle of amounts.',
    aRetenir:
      'CSV only has a light standard (RFC 4180): fix the separator, the encoding (UTF-8), the header line and quote escaping, and write them into the exchange contract.',
    liens: [
      {
        titre: 'Comma-separated values',
        url: 'https://en.wikipedia.org/wiki/Comma-separated_values',
        langue: 'en',
      },
      {
        titre: 'RFC 4180: the CSV format',
        url: 'https://www.rfc-editor.org/rfc/rfc4180.html',
        langue: 'en',
      },
    ],
  },
  5: {
    definition:
      'A text file where each field always occupies the same columns: no separator, fixed-length lines, values padded with spaces or zeros.',
    usage:
      'The format of legacy systems (mainframe, COBOL, banking, payroll): easy to read for a machine that knows the column layout, the “record layout”.',
    exemple:
      'The amount sits in columns 47 to 52, on 6 digits with no decimal point: “001250” means €12.50. One character out of place, and the whole line is wrong.',
    aRetenir:
      'Without an up-to-date layout, the file is unreadable: version the record layout, check the length of every line and reject the file at the first offset.',
    liens: [
      {
        titre: 'Flat-file database (fixed-width files)',
        url: 'https://en.wikipedia.org/wiki/Flat-file_database',
        langue: 'en',
      },
      { titre: 'COBOL', url: 'https://en.wikipedia.org/wiki/COBOL', langue: 'en' },
    ],
  },
  6: {
    definition:
      'The Unix job scheduler: it runs commands at set times, described in a table (crontab) with five fields: minute, hour, day of month, month, day of week.',
    usage:
      'Triggering recurring jobs: nightly imports, purges, backups, report sending. “0 2 * * *” means “every day at 2:00 a.m.”.',
    exemple:
      'At 2 a.m. cron starts the order import; at 3 a.m. the billing one, assuming the first has finished… which cron does not check.',
    aRetenir:
      'Cron starts jobs, it does not watch them: with no alert on failure, no lock against two overlapping runs and no care for the switch to summer time, jobs fail silently.',
    liens: [
      { titre: 'cron', url: 'https://en.wikipedia.org/wiki/Cron', langue: 'en' },
      {
        titre: 'crontab(5), Linux manual page',
        url: 'https://man7.org/linux/man-pages/man5/crontab.5.html',
        langue: 'en',
      },
    ],
  },
  7: {
    definition:
      'A shared folder where one system drops files and another comes to collect them: the meeting point of file-based integration.',
    usage:
      'Decoupling sender and receiver in time: one drops whenever it likes, the other polls the folder at regular intervals, processes what it finds, then archives it.',
    exemple:
      'The payroll software drops transfers.xml in /drop/incoming; every 5 minutes the integration picks it up, processes it and moves it to /drop/archive.',
    aRetenir:
      'One folder per stage (incoming, in progress, processed, failed), never read a file that is still being written, and purge the archives: otherwise the drop folder becomes an attic.',
    liens: [
      {
        titre: 'File Transfer (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/FileTransferIntegration.html',
        langue: 'en',
      },
    ],
  },
  8: {
    definition:
      'A small file, often empty, dropped just after the data file to signal that it is complete and ready to be processed.',
    usage:
      'Avoiding reading a file that is still being copied: the receiver waits for orders.ok before taking orders.csv. The flag file can also carry the line count or a checksum.',
    exemple:
      'The 2 GB transfer ends at 2:07 a.m., the flag file arrives at 2:08. The 2:05 run took nothing; the 2:10 run processes the whole file.',
    aRetenir:
      'The flag file only counts if it is dropped after the data file. Another safeguard: write under a temporary name, then rename, an atomic operation. And verify the checksum.',
    liens: [
      {
        titre: 'File Transfer (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/FileTransferIntegration.html',
        langue: 'en',
      },
      { titre: 'Checksum', url: 'https://en.wikipedia.org/wiki/Checksum', langue: 'en' },
    ],
  },
};
