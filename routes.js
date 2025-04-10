// Store the information about each building here.
const buildings = [];

// Store the schedule information here.
const schedules = [];

// Parses and records information on all the buildings.
export const parseBuildings = (lines) => {
  // Clear any existing data
  buildings.length = 0;

  for (const line of lines) {
    const [shortName, longName, x, y] = line.split(',');

    buildings.push({
      shortName,
      longName,
      x: parseFloat(x),
      y: parseFloat(y)
    });
  }
};


// Parses and records information on all the schedules.
export const parseSchedules = (lines) => {
  // Clear any existing data
  schedules.length = 0;

  for (const line of lines) {
    const [friend, time, shortName] = line.split(',');

    schedules.push({ friend, time, shortName });
  }
};

// Returns a list of (<= 3) buildings whose names contain the given text.
export const findByName = (req, res) => {
  const searchText = req.query.text?.toLowerCase() || '';
  const results = buildings.filter(b =>
    b.longName.toLowerCase().includes(searchText)
  ).slice(0, 3);

  res.send({ results });
};


// Returns a list of the 3 buildings located closest to the given point.
export const findBuildingsByPosition = (req, res) => {
  const x = parseFloat(req.query.x);
  const y = parseFloat(req.query.y);

  if (isNaN(x) || isNaN(y)) {
    return res.status(400).send({ error: 'Invalid coordinates' });
  }

  const results = buildings
    .map(b => ({
      ...b,
      distance: (b.x - x) ** 2 + (b.y - y) ** 2
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(({ distance, ...b }) => b);

  res.send({ results });
};


// Utility: Get building object by shortName
const getBuildingCoordinates = (shortName) => {
  return buildings.find(b => b.shortName === shortName);
};

// Returns a list of the classes associated with the given friend.
export const findByFriend = (req, res) => {
  const friendName = req.query.text?.toLowerCase() || '';
  const results = [];

  for (const schedule of schedules) {
    if (schedule.friend.toLowerCase() === friendName) {
      const building = getBuildingCoordinates(schedule.shortName);
      if (building) {
        results.push({
          ...schedule,
          x: building.x,
          y: building.y
        });
      }
    }
  }

  res.send({ results });
};


// Returns a list of the classes associated with the given time.
export const findByTime = (req, res) => {
  const searchTime = req.query.text;
  const results = [];

  for (const schedule of schedules) {
    if (schedule.time === searchTime) {
      const building = getBuildingCoordinates(schedule.shortName);
      if (building) {
        results.push({
          ...schedule,
          x: building.x,
          y: building.y
        });
      }
    }
  }

  res.send({ results });
};


// Returns a list of 3 unique friends closest to the x, y provided.
export const findFriendsByPosition = (req, res) => {
  const x = parseFloat(req.query.x);
  const y = parseFloat(req.query.y);

  if (isNaN(x) || isNaN(y)) {
    return res.status(400).send({ error: 'Invalid coordinates' });
  }

  const classesWithDistances = schedules
    .map(schedule => {
      const building = getBuildingCoordinates(schedule.shortName);
      if (!building) return null;

      const distance = (building.x - x) ** 2 + (building.y - y) ** 2;
      return { ...schedule, x: building.x, y: building.y, distance };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);

  const uniqueFriends = new Map();

  for (const classInfo of classesWithDistances) {
    if (!uniqueFriends.has(classInfo.friend)) {
      uniqueFriends.set(classInfo.friend, classInfo);
      if (uniqueFriends.size === 3) break;
    }
  }

  const results = Array.from(uniqueFriends.values()).map(({ distance, ...rest }) => rest);
  res.send({ results: results.length === 3 ? results : []});
};