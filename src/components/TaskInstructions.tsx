import { task } from '../data/task'
import type { Role } from '../types/experiment'
import { WorksheetSymbol } from './WorksheetSymbol'

export function TaskInstructions({ role }: { role: Role }) {
  return (
    <>
      <header className="worksheet-header">
        <p className="eyebrow">Your assigned worksheet</p>
        <h2 id="worksheet-title">{task.title}</h2>
        <p>Your scenario name: <strong>{task.names[role]}</strong></p>
      </header>
      {role === 'traveler' ? (
        <>
          <section className="worksheet-section" aria-labelledby="purpose-title">
            <h3 id="purpose-title"><WorksheetSymbol kind="purpose" />Reason for your call</h3>
            <p>Intended journey: <strong>{task.route}</strong></p>
          </section>
          <section className="worksheet-section" aria-labelledby="conditions-title">
            <h3 id="conditions-title"><WorksheetSymbol kind="conditions" />Journey requirements</h3>
            <ul className="worksheet-facts">
              {task.travelerConditions.map((condition) => <li key={condition}>{condition}</li>)}
            </ul>
          </section>
        </>
      ) : (
        <section className="worksheet-section" aria-labelledby="timetable-title">
          <h3 id="timetable-title"><WorksheetSymbol kind="information" />Timetable: London → Inverness</h3>
          <div
            className="table-scroll"
            role="region"
            aria-label="Train timetable, horizontally scrollable"
            tabIndex={0}
          >
            <table className="worksheet-timetable">
              <caption>Scenario timetable · All arrival times at Inverness are on the next day.</caption>
              <thead>
                <tr>
                  <th scope="col">Train number</th>
                  {task.timetable[0].values.map((train) => <th scope="col" key={train}>{train}</th>)}
                </tr>
              </thead>
              <tbody>
                {task.timetable.slice(1).map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {row.values.map((value, index) => <td key={index}>{value}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
