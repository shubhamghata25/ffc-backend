/*
  Re-exports of shared admin UI atoms.
  AdminPage.jsx still defines everything — this file
  just gives AdminStore / AdminExercises a clean import path.
  All actual definitions live in AdminPage.jsx and are passed
  as props by the parent.  No circular dependency.
*/
export {}  // empty — components are passed as props
