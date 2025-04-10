// Store the information about each building here.
const buildings = [];

// Store the schedule information here.
const schedules = [];

// Parses and records information on all the buildings.
export const parseBuildings = (lines) => {
  // Clear any existing data
  buildings.length = 0;

  for (const line of lines) {
    // Split the line by commas
    const parts = line.split(',');

    // Creat a building record
    const building = {
      shortName: parts[0],
      longName: parts[1],
      x: parseFloat(parts[2]),
      Y: parseFloat(parts[3])
    };

    // Add to buildings array
    buildings.push(building);
  }
};


// Parses and records information on all the schedules.
export const parseSchedules = (lines) => {
  // Clear any existing data
  schedules.length = 0;

  for (const line of lines) {
    // Split the line by commas
    const parts = line.split(',');

    // Create a schedule record
    const schedule = {
      friend: parts[0],
      time: parts[1],
      shortName: parts[2]
    };

    // Add to schedules array
    schedules.push(schedule);
  }
};

// Returns a list of (<= 3) buildings whose names contain the given text.
export const findByName = (req, res) => {
  const searchText = req.query.text.toLowerCase();
  const results = [];

  for (const building of buildings) {
    if (building.longName.toLowerCase().includes(searchText)) {
      results.push(building);

      // Return early if we already have 3 matches
      if (results.length === 3) {
        break;
      }
    }
  }

  res.send({ results });
};


// Returns a list of the 3 buildings located closest to the given point.
export const findBuildingsByPosition = (req, res) => {
  const x = parseFloat(req.query.x);
  const y = parseFloat(req.query.y);

  if (isNaN(x) || isNaN(y)) {
    return res.status(400).send({ error: 'Invalid coordinates'});
  }

  // Create an array with buildings and their distances
  const buildingsWithDistances = buildings.map(building => {
    const dx = building.x - x;
    const dy = building.y - y;
    const distance = dx * dx + dy + dy; // No need for sqrt since we just compare
    return { ...building, distance };
  });

  // Sort by distance (ascending)
  buildingsWithDistances.sort((a, b) => a.distance - b.distance);

  // Get the first 3 buildings (closest)
  const closestBuildings = buildingsWithDistances.slice(0, 3);

  // Remove the distance property before sending
  const results = closestBuildings.map(({ distance, ...building }) => building);
  
  res.send({ results });
}


// Returns a list of the classes associated with the given friend.
export const findByFriend = (req, res) => {
  const searchName = req.query.text.toLowerCase();
  const results = [];

  for (const schedule of schedules) {
    if (schedule.friend.toLowerCase() === searchName) {
      // Find the building coordinates for this schedule's shortName
      const building = buildings.find(b => b.shortName === schedule.shortName);
      if (building) {
        results.push({
          friend: schedule.friend,
          time: schedule.time,
          shortName: schedule.shortName,
          x: building.x,
          y: building.y          
        });
      }
    }
  }

  res.send(results);
};


// Returns a list of the classes associated with the given time.
export const findByTime = (req, res) => {
  const searchTime = req.query.text;
  const results = [];

  for (const schedule of schedules) {
    if (schedule.time === searchTime) {
      const building = buildings.find(b => b.shortName === schedule.shortName);
      if (building) {
        results.push({
          friend: schedule.friend,
          time: schedule.time,
          shortName: schedule.shortName,
          x: building.x,
          y: building.y          
        })
      }
    }
  }
}


// Returns a list of 3 unique friends closest to the x, y provided.
export const findFriendsByPosition = (req, res) => {
  const x = parseFloat(req.query.x);
  const y = parseFloat(req.query.y);

  if (isNaN(x) || isNaN(y)) {
    return res.status(400).send({ error: 'Invalid coordinates'});
  }

  // Calculate distance for each scheduled class and include friend info
  const classesWithDistances = schedules.map(schedules => {
    const building = buildings.find(b => b.shortName === schedule.shortName);
    if (!building) return null;

    const dx = building.x - x;
    const dy = building.y - y;
    const distance = dx ** 2 + dy ** 2;

    return { ...schedules, distance };
  }).filter(Boolean); // Remove null entries where building wasn't found

  // Sort by distance and get unique friends
  const uniqueFriends = new Map();
  classesWithDistances.sort((a, b) => a.distance - b.distance);

  for (const classInfo of classesWithDistances) {
    if (!uniqueFriends.has(classInfo.friend)) {
      uniqueFriends.set(classInfo.friend, classInfo);
      if (uniqueFriends.size === 3) break; // Stop when we have 3 unique friends
    }
  }

  // Convert to array and remove distance property
  const results = Array.from(uniqueFriends.values()).map(({ distance, ...rest }) => rest);
  
  res.send(results.length === 3 ? results : []); // Only return if we found 3 friends
}
