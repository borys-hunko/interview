const generateArray = (length: number) =>
  [...new Array(length)].map((_, index) => index);

const asyncGet = (n: number): Promise<number> =>
  new Promise((resolve) => {
    const delay = Math.random() * 1000;
    console.log("delay", delay);
    return setTimeout(() => resolve(n * 2), delay);
  });

// used for changing the Promise value to contain the index in promises queueu
const wrapAsyncGet = async (number: number, index: number) => {
  const asyncGetResult = await asyncGet(number);
  return {
    num: asyncGetResult,
    index,
  };
};

const runMaxParallel = async (
  args: number[],
  maxParallel: number,
): Promise<number[]> => {
  const start = Date.now();

  // first numbers to be passed to asyncGet
  const firstBatchNumbers = args.slice(0, maxParallel);
  const otherNumbers = args.slice(maxParallel);
  const asyncGetResults: number[] = [];

  // this collection will be used as our improvised thread pull. it will contain all task which are run in parallel
  const parallelPromises = firstBatchNumbers.map((batchNumber, index) =>
    wrapAsyncGet(batchNumber, index),
  );

  /*
   * We run all tasks in parallelPromises with Promise.race().
   * Promise.race will return the first executed tasks, and it's index. The rest of tasks will continue to execute.
   * We pass the result of asyncGet to the result's list and replace the finished task with new one and continue to execute race,
   *  until we execute asyncGet with all numbers from otherNumbers
   * When we iterate through all values from otherNumbers we just execute Promise.all for the rest of parallelPromises.
   * */
  for (const nextNumber of otherNumbers) {
    const raceResult = await Promise.race(parallelPromises);

    asyncGetResults.push(raceResult.num);

    parallelPromises[raceResult.index] = wrapAsyncGet(
      nextNumber,
      raceResult.index,
    );
  }

  const remainedAsyncGetResults = await Promise.all(parallelPromises);

  const remainedResults = remainedAsyncGetResults.map((res) => res.num);
  asyncGetResults.push(...remainedResults);

  console.log("execution time", Date.now() - start);

  return asyncGetResults;
};

const result = runMaxParallel(generateArray(20), 3);

result.then((res) => console.log("runMaxParallel", res));
