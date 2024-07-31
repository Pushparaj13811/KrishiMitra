import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connect = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    ); // mongoose returns a object
    console.log(
      `Database :: connect :: success :: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("Error :: Database :: connect :: error", error);
    process.exit(1);
  }
};

export default connect;
