# Assignment Management System

A lightweight web application for managing group-based assignments, built with Node.js and MySQL.

## Features

### Teacher Features
- Create and manage groups with unique join codes
- Create assignments with deadlines
- View student submissions
- Track submission status

### Student Features
- Join groups using join codes
- View assigned assignments
- Submit assignments (file upload or link)
- Track submission status

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd assignment-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=assignment_management
PORT=3000
JWT_SECRET=your_jwt_secret_key
```

4. Start the application:
```bash
npm start
```

The application will automatically:
- Create the database if it doesn't exist
- Create all required tables
- Start the server on the specified port (default: 3000)

## Usage

1. Open your browser and navigate to `http://localhost:3000`

2. Register as either a teacher or student:
   - Teachers can create groups and assignments
   - Students can join groups and submit assignments

3. For teachers:
   - Create a group to get a unique join code
   - Share the join code with students
   - Create assignments for the group
   - Monitor student submissions

4. For students:
   - Use the join code to join a group
   - View assigned assignments
   - Submit assignments before the deadline

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Groups
- POST `/api/groups` - Create new group (teacher only)
- GET `/api/groups/teacher` - Get teacher's groups
- GET `/api/groups/student` - Get student's groups
- POST `/api/groups/join` - Join group (student only)
- GET `/api/groups/:id` - Get group details

### Assignments
- POST `/api/assignments` - Create new assignment (teacher only)
- GET `/api/assignments/teacher` - Get teacher's assignments
- GET `/api/assignments/student` - Get student's assignments
- GET `/api/assignments/:id` - Get assignment details

### Submissions
- POST `/api/submissions` - Submit assignment (student only)
- GET `/api/submissions/:assignmentId` - Get submission details

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Input validation on all endpoints
- Role-based access control

## Error Handling

The application includes comprehensive error handling for:
- Database connection issues
- Invalid input
- Authentication failures
- Authorization violations
- File upload errors

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request "# Assignment-Management-System" 
