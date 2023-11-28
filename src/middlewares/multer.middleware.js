//we are writing this middleware for the purpose that before uploading it to the clodinary we are saving it in out server that's why we wrote this middleware
import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) { //cb is for callback
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname)     //we wrote this extra option for adding a unique suffix at the end of the file name
    }
  })
  
export const upload = multer({ storage: storage })