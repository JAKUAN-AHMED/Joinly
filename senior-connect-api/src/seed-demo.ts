import 'dotenv/config';
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import {
  ActivityStatus,
  Difficulty,
  NotificationAudience,
  NotificationStatus,
  UserRole,
  UserStatus,
} from './common/enums';
import { typeOrmConfig } from './config/typeorm.config';
import { Category } from './modules/categories/entities/category.entity';
import { Activity } from './modules/activities/entities/activity.entity';
import { ActivityParticipant } from './modules/participants/entities/activity-participant.entity';
import { Notification } from './modules/notifications/entities/notification.entity';
import { UserNotification } from './modules/notifications/entities/user-notification.entity';
import { User, UserInterest } from './modules/users/entities';

const DEMO_PASSWORD = 'password123';
const daysAgo = (n: number): Date => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n: number): string =>
  new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** Real, viewable photos (not placeholders) — Pravatar for faces, Picsum for activity photos. */
const avatarUrl = (pravatarId: number): string => `https://i.pravatar.cc/300?img=${pravatarId}`;
const activityPhotoUrl = (slug: string): string => `https://picsum.photos/seed/${slug}/640/480`;

const demoUsers: Array<{
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  region?: string;
  city?: string;
  status: UserStatus;
  isEmailVerified: boolean;
  joinedDaysAgo: number; // fractional days allowed (e.g. 0.2 = ~5 hours ago) for "Recent Users"
  avatarId: number;
}> = [
  { firstName: 'Arthur', lastName: 'Thorne', email: 'arthur.thorne@provider.com', country: 'UK', region: 'England', city: 'London', status: UserStatus.Active, isEmailVerified: true, joinedDaysAgo: 62, avatarId: 11 },
  { firstName: 'David', lastName: 'Kwan', email: 'david.kwan@provider.com', country: 'Canada', region: 'Ontario', city: 'Toronto', status: UserStatus.Inactive, isEmailVerified: true, joinedDaysAgo: 88, avatarId: 12 },
  { firstName: 'Elena', lastName: 'Marquez', email: 'elena.marquez@provider.com', country: 'Spain', region: 'Catalonia', city: 'Barcelona', status: UserStatus.Suspended, isEmailVerified: true, joinedDaysAgo: 51, avatarId: 47 },
  { firstName: 'Lars', lastName: 'Hansen', email: 'lars.hansen@provider.com', country: 'Denmark', region: 'Capital Region', city: 'Copenhagen', status: UserStatus.Active, isEmailVerified: true, joinedDaysAgo: 40, avatarId: 13 },
  { firstName: 'James', lastName: "O'Neil", email: 'james.oneil@provider.com', country: 'USA', region: 'New York', city: 'New York', status: UserStatus.Active, isEmailVerified: true, joinedDaysAgo: 75, avatarId: 14 },
  { firstName: 'Maya', lastName: 'Patel', email: 'maya.patel@provider.com', country: 'India', region: 'Maharashtra', city: 'Mumbai', status: UserStatus.Active, isEmailVerified: true, joinedDaysAgo: 33, avatarId: 48 },
  { firstName: 'Sofia', lastName: 'Moretti', email: 'sofia.moretti@provider.com', country: 'Italy', region: 'Lombardy', city: 'Milan', status: UserStatus.Inactive, isEmailVerified: true, joinedDaysAgo: 29, avatarId: 49 },
  { firstName: 'Fatima', lastName: 'Al-Sayed', email: 'fatima.alsayed@provider.com', country: 'UAE', region: 'Dubai', city: 'Dubai', status: UserStatus.Active, isEmailVerified: true, joinedDaysAgo: 21, avatarId: 50 },
  // "Recent Users" (last 24h)
  { firstName: 'Jane', lastName: 'Dorsey', email: 'jane@example.com', country: 'USA', region: 'California', city: 'San Diego', status: UserStatus.Active, isEmailVerified: true, joinedDaysAgo: 0.8, avatarId: 45 },
  { firstName: 'Marcus', lastName: 'Kane', email: 'm.kane@provider.com', country: 'Canada', region: 'Quebec', city: 'Montreal', status: UserStatus.Active, isEmailVerified: true, joinedDaysAgo: 0.5, avatarId: 15 },
  { firstName: 'Elena', lastName: 'Lopez', email: 'elopez@mail.com', country: 'Spain', region: 'Madrid', city: 'Madrid', status: UserStatus.Pending, isEmailVerified: false, joinedDaysAgo: 0.3, avatarId: 44 },
  { firstName: 'Brian', lastName: 'Thompson', email: 'brian.t@tech.org', country: 'USA', region: 'Texas', city: 'Austin', status: UserStatus.Active, isEmailVerified: true, joinedDaysAgo: 0.1, avatarId: 16 },
];

async function seedDemo(): Promise<void> {
  const dataSource = new DataSource({
    ...(typeOrmConfig() as import('typeorm').DataSourceOptions),
  });
  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);
  const categoryRepository = dataSource.getRepository(Category);
  const activityRepository = dataSource.getRepository(Activity);
  const participantRepository = dataSource.getRepository(ActivityParticipant);
  const notificationRepository = dataSource.getRepository(Notification);
  const userNotificationRepository = dataSource.getRepository(UserNotification);
  const interestRepository = dataSource.getRepository(UserInterest);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ---- Users ----
  const userIdByEmail = new Map<string, string>();
  for (const u of demoUsers) {
    let user = await userRepository.findOne({ where: { email: u.email } });
    const isNew = !user;
    if (!user) {
      user = userRepository.create({
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        password: passwordHash,
        country: u.country,
        region: u.region ?? null,
        city: u.city ?? null,
        role: UserRole.User,
        status: u.status,
        isEmailVerified: u.isEmailVerified,
      });
    }
    user.profilePhoto = avatarUrl(u.avatarId);
    user = await userRepository.save(user);
    if (isNew) {
      await dataSource.query('UPDATE users SET created_at = $1 WHERE id = $2', [
        daysAgo(u.joinedDaysAgo),
        user.id,
      ]);
    }
    userIdByEmail.set(u.email, user.id);
  }
  console.log(`Seeded ${demoUsers.length} demo users with real avatar photos (password: ${DEMO_PASSWORD})`);

  // ---- Backfill photos onto users/activities created outside this script (e.g. mobile smoke-test data) ----
  await userRepository.update(
    { email: 'admin@contenthub.io' },
    { profilePhoto: avatarUrl(5) },
  );
  await userRepository.update(
    { email: 'jean.moreau@example.com' },
    { profilePhoto: avatarUrl(33) },
  );
  await dataSource.query(
    "UPDATE activities SET activity_photo = $1 WHERE activity_name = 'Morning Hike' AND activity_photo IS NULL",
    [activityPhotoUrl('morning-hike-lavaux')],
  );

  // ---- Interests (Arthur + David get a few, for User Details testing) ----
  const categories = await categoryRepository.find();
  const categoryByName = new Map(categories.map((c) => [c.categoryName, c]));
  const assignInterests = async (email: string, names: string[]) => {
    const userId = userIdByEmail.get(email);
    if (!userId) return;
    for (const name of names) {
      const category = categoryByName.get(name);
      if (!category) continue;
      const exists = await interestRepository.findOne({ where: { userId, categoryId: category.id } });
      if (!exists) {
        await interestRepository.save(interestRepository.create({ userId, categoryId: category.id }));
      }
    }
  };
  await assignInterests('arthur.thorne@provider.com', ['Football', 'Golf', 'Rowing', 'Boxing']);
  await assignInterests('david.kwan@provider.com', ['Cycling', 'Swimming']);
  await assignInterests('maya.patel@provider.com', ['Badminton', 'Table Tennis', 'Tennis']);

  // ---- Activities ----
  const categoryId = (name: string): string => {
    const c = categoryByName.get(name);
    if (!c) throw new Error(`Category not found: ${name}`);
    return c.id;
  };
  const organizerId = (email: string): string => {
    const id = userIdByEmail.get(email);
    if (!id) throw new Error(`User not found: ${email}`);
    return id;
  };

  const demoActivities: Array<{
    activityName: string;
    categoryName: string;
    organizerEmail: string;
    descriptions: string;
    activityDate: string;
    activityTime: string;
    activityDuration: string;
    activityLocation: string;
    minAge: number;
    maxAge: number;
    price: number | null;
    difficulty: Difficulty;
    status: ActivityStatus;
    rejectionReason?: string;
    maximumNumberOfParticipants: number;
    photoSlug: string;
  }> = [
    { activityName: 'Sunset Football Match', categoryName: 'Football', organizerEmail: 'arthur.thorne@provider.com', descriptions: 'A friendly 7-a-side match as the sun goes down. All skill levels welcome, just bring your boots and energy.', activityDate: daysFromNow(5), activityTime: '18:00', activityDuration: '1.5 Hours', activityLocation: 'Hyde Park Sports Field, London', minAge: 16, maxAge: 55, price: 0, difficulty: Difficulty.Beginner, status: ActivityStatus.Approved, maximumNumberOfParticipants: 14, photoSlug: 'sunset-football-match' },
    { activityName: 'Weekend Cycling Tour', categoryName: 'Cycling', organizerEmail: 'david.kwan@provider.com', descriptions: 'A scenic 25km ride along the waterfront trail, ending with coffee at a local cafe.', activityDate: daysFromNow(10), activityTime: '09:00', activityDuration: '3 Hours', activityLocation: 'Toronto Waterfront Trail', minAge: 18, maxAge: 65, price: 5, difficulty: Difficulty.Intermediate, status: ActivityStatus.Approved, maximumNumberOfParticipants: 20, photoSlug: 'weekend-cycling-tour' },
    { activityName: 'Community Pool Swim', categoryName: 'Swimming', organizerEmail: 'elena.marquez@provider.com', descriptions: 'Open swim session for the community pool, lifeguard on duty throughout.', activityDate: daysFromNow(3), activityTime: '10:00', activityDuration: '2 Hours', activityLocation: 'Barcelona Municipal Pool', minAge: 12, maxAge: 70, price: 3, difficulty: Difficulty.Beginner, status: ActivityStatus.Pending, maximumNumberOfParticipants: 30, photoSlug: 'community-pool-swim' },
    { activityName: 'Pickup Basketball Game', categoryName: 'Basketball', organizerEmail: 'lars.hansen@provider.com', descriptions: 'Casual 5-on-5 pickup games, come solo or with a team.', activityDate: daysFromNow(7), activityTime: '17:30', activityDuration: '2 Hours', activityLocation: 'Copenhagen Community Court', minAge: 16, maxAge: 45, price: 0, difficulty: Difficulty.Intermediate, status: ActivityStatus.Approved, maximumNumberOfParticipants: 12, photoSlug: 'pickup-basketball-game' },
    { activityName: 'Alpine Skiing Weekend', categoryName: 'Skiing', organizerEmail: 'james.oneil@provider.com', descriptions: 'A weekend trip to the slopes, carpooling arranged for participants.', activityDate: daysFromNow(20), activityTime: '07:00', activityDuration: '2 Days', activityLocation: 'Adirondack Ski Resort', minAge: 18, maxAge: 60, price: 45, difficulty: Difficulty.Advanced, status: ActivityStatus.Pending, maximumNumberOfParticipants: 8, photoSlug: 'alpine-skiing-weekend' },
    { activityName: 'Indoor Climbing Session', categoryName: 'Climbing', organizerEmail: 'maya.patel@provider.com', descriptions: 'Bouldering and top-rope climbing for all levels at the indoor gym.', activityDate: daysFromNow(2), activityTime: '16:00', activityDuration: '2 Hours', activityLocation: 'Mumbai Indoor Climbing Gym', minAge: 14, maxAge: 50, price: 8, difficulty: Difficulty.Intermediate, status: ActivityStatus.Rejected, rejectionReason: 'Insufficient safety equipment details provided.', maximumNumberOfParticipants: 10, photoSlug: 'indoor-climbing-session' },
    { activityName: 'Doubles Tennis Tournament', categoryName: 'Tennis', organizerEmail: 'sofia.moretti@provider.com', descriptions: 'Friendly doubles tournament with prizes for the top two pairs.', activityDate: daysFromNow(14), activityTime: '09:00', activityDuration: '4 Hours', activityLocation: 'Milan Tennis Club', minAge: 16, maxAge: 65, price: 10, difficulty: Difficulty.Intermediate, status: ActivityStatus.Approved, maximumNumberOfParticipants: 16, photoSlug: 'doubles-tennis-tournament' },
    { activityName: 'Table Tennis Social', categoryName: 'Table Tennis', organizerEmail: 'fatima.alsayed@provider.com', descriptions: 'Relaxed social table tennis evening, all equipment provided.', activityDate: daysFromNow(1), activityTime: '19:00', activityDuration: '2 Hours', activityLocation: 'Dubai Community Hall', minAge: 10, maxAge: 70, price: 0, difficulty: Difficulty.Beginner, status: ActivityStatus.Approved, maximumNumberOfParticipants: 18, photoSlug: 'table-tennis-social' },
    { activityName: 'Badminton Club Night', categoryName: 'Badminton', organizerEmail: 'jane@example.com', descriptions: 'Weekly badminton club night, singles and doubles courts available.', activityDate: daysFromNow(6), activityTime: '18:30', activityDuration: '2 Hours', activityLocation: 'San Diego Badminton Center', minAge: 12, maxAge: 60, price: 4, difficulty: Difficulty.Beginner, status: ActivityStatus.Pending, maximumNumberOfParticipants: 16, photoSlug: 'badminton-club-night' },
    { activityName: 'Handball Friendly Match', categoryName: 'Handball', organizerEmail: 'm.kane@provider.com', descriptions: 'Friendly handball match against a neighboring club.', activityDate: daysFromNow(9), activityTime: '15:00', activityDuration: '1.5 Hours', activityLocation: 'Montreal Sports Complex', minAge: 16, maxAge: 45, price: 0, difficulty: Difficulty.Intermediate, status: ActivityStatus.Approved, maximumNumberOfParticipants: 14, photoSlug: 'handball-friendly-match' },
    { activityName: 'Golf Morning Round', categoryName: 'Golf', organizerEmail: 'elopez@mail.com', descriptions: 'A relaxed 9-hole morning round, great for beginners and regulars alike.', activityDate: daysFromNow(12), activityTime: '08:00', activityDuration: '3 Hours', activityLocation: 'Madrid Golf Course', minAge: 18, maxAge: 75, price: 25, difficulty: Difficulty.Beginner, status: ActivityStatus.Approved, maximumNumberOfParticipants: 8, photoSlug: 'golf-morning-round' },
    { activityName: 'Charity Boxing Sparring', categoryName: 'Boxing', organizerEmail: 'brian.t@tech.org', descriptions: 'Light sparring session raising funds for the local youth center.', activityDate: daysFromNow(4), activityTime: '17:00', activityDuration: '2 Hours', activityLocation: 'Austin Boxing Gym', minAge: 18, maxAge: 40, price: 15, difficulty: Difficulty.Advanced, status: ActivityStatus.Rejected, rejectionReason: 'Requires certified trainer supervision on-site.', maximumNumberOfParticipants: 10, photoSlug: 'charity-boxing-sparring' },
    { activityName: 'Sunday Rowing Practice', categoryName: 'Rowing', organizerEmail: 'arthur.thorne@provider.com', descriptions: 'Early morning rowing practice on the river, coaching provided for beginners.', activityDate: daysFromNow(8), activityTime: '07:30', activityDuration: '2 Hours', activityLocation: 'Thames Rowing Club, London', minAge: 16, maxAge: 60, price: 0, difficulty: Difficulty.Beginner, status: ActivityStatus.Approved, maximumNumberOfParticipants: 12, photoSlug: 'sunday-rowing-practice' },
    { activityName: 'Beginner Football Clinic', categoryName: 'Football', organizerEmail: 'david.kwan@provider.com', descriptions: 'A skills clinic focused on fundamentals for newcomers to the sport.', activityDate: daysFromNow(15), activityTime: '10:00', activityDuration: '2 Hours', activityLocation: 'Toronto Youth Sports Field', minAge: 10, maxAge: 30, price: 0, difficulty: Difficulty.Beginner, status: ActivityStatus.Pending, maximumNumberOfParticipants: 20, photoSlug: 'beginner-football-clinic' },
    { activityName: 'Historic Park Run', categoryName: 'Football', organizerEmail: 'jane@example.com', descriptions: 'A completed community fun run through the historic downtown park.', activityDate: daysFromNow(-20), activityTime: '08:00', activityDuration: '1 Hour', activityLocation: 'San Diego Historic Park', minAge: 10, maxAge: 75, price: 0, difficulty: Difficulty.Beginner, status: ActivityStatus.Completed, maximumNumberOfParticipants: 25, photoSlug: 'historic-park-run' },
    { activityName: 'Cancelled Ski Trip', categoryName: 'Skiing', organizerEmail: 'maya.patel@provider.com', descriptions: 'A ski trip that was cancelled due to insufficient snowfall.', activityDate: daysFromNow(25), activityTime: '07:00', activityDuration: '1 Day', activityLocation: 'Mumbai Indoor Ski Dome', minAge: 18, maxAge: 55, price: 30, difficulty: Difficulty.Intermediate, status: ActivityStatus.Cancelled, maximumNumberOfParticipants: 10, photoSlug: 'cancelled-ski-trip' },
  ];

  const activityIdByName = new Map<string, string>();
  for (const a of demoActivities) {
    let activity = await activityRepository.findOne({ where: { activityName: a.activityName } });
    if (!activity) {
      activity = activityRepository.create({
        activityName: a.activityName,
        categoryId: categoryId(a.categoryName),
        descriptions: a.descriptions,
        maximumNumberOfParticipants: a.maximumNumberOfParticipants,
        activityDate: a.activityDate,
        activityTime: a.activityTime,
        activityDuration: a.activityDuration,
        activityLocation: a.activityLocation,
        minAge: a.minAge,
        maxAge: a.maxAge,
        price: a.price,
        difficulty: a.difficulty,
        status: a.status,
        rejectionReason: a.rejectionReason ?? null,
        organizerId: organizerId(a.organizerEmail),
      });
    }
    activity.activityPhoto = activityPhotoUrl(a.photoSlug);
    activity = await activityRepository.save(activity);
    activityIdByName.set(a.activityName, activity.id);
  }
  console.log(`Seeded ${demoActivities.length} demo activities with real photos`);

  // ---- Participants (joins) ----
  const joins: Array<{ activityName: string; emails: string[] }> = [
    { activityName: 'Sunset Football Match', emails: ['jane@example.com', 'm.kane@provider.com', 'elopez@mail.com'] },
    { activityName: 'Pickup Basketball Game', emails: ['david.kwan@provider.com', 'sofia.moretti@provider.com'] },
    { activityName: 'Doubles Tennis Tournament', emails: ['fatima.alsayed@provider.com', 'brian.t@tech.org'] },
    { activityName: 'Sunday Rowing Practice', emails: ['james.oneil@provider.com'] },
    { activityName: 'Historic Park Run', emails: ['m.kane@provider.com', 'brian.t@tech.org'] },
  ];
  let joinCount = 0;
  for (const j of joins) {
    const activityId = activityIdByName.get(j.activityName);
    if (!activityId) continue;
    for (const email of j.emails) {
      const userId = userIdByEmail.get(email);
      if (!userId) continue;
      const exists = await participantRepository.findOne({ where: { activityId, userId } });
      if (!exists) {
        await participantRepository.save(participantRepository.create({ activityId, userId }));
        joinCount++;
      }
    }
  }
  console.log(`Seeded ${joinCount} activity participant joins`);

  // ---- Notifications ----
  const admin = await userRepository.findOne({ where: { email: 'admin@contenthub.io' } });
  const demoNotifications: Array<{
    notificationTitle: string;
    messageContent: string;
    audience: NotificationAudience;
    status: NotificationStatus;
    sentDaysAgo: number;
  }> = [
    { notificationTitle: 'Spring Picnic Invitation', messageContent: 'Join us for the annual community picnic this Saturday at Central Park.', audience: NotificationAudience.Everyone, status: NotificationStatus.Delivered, sentDaysAgo: 12 },
    { notificationTitle: 'Volunteers Needed for Cleanup', messageContent: "Urgent help required for tomorrow's neighborhood cleanup event.", audience: NotificationAudience.Volunteers, status: NotificationStatus.Delivered, sentDaysAgo: 10 },
    { notificationTitle: 'Scheduled Maintenance Tonight', messageContent: 'The dashboard will be offline briefly for scheduled maintenance at 11 PM.', audience: NotificationAudience.Everyone, status: NotificationStatus.Delivered, sentDaysAgo: 8 },
    { notificationTitle: 'Senior Wellness Workshop', messageContent: 'A free wellness and mobility workshop for our senior members next week.', audience: NotificationAudience.Seniors, status: NotificationStatus.Delivered, sentDaysAgo: 6 },
    { notificationTitle: 'New Badminton Club Launching', messageContent: 'A brand new weekly badminton club is starting — sign up on the app!', audience: NotificationAudience.Everyone, status: NotificationStatus.Delivered, sentDaysAgo: 5 },
    { notificationTitle: 'Weather Alert: Heavy Rain Expected', messageContent: 'Several outdoor activities this weekend may be affected by heavy rain.', audience: NotificationAudience.Everyone, status: NotificationStatus.Failed, sentDaysAgo: 3 },
    { notificationTitle: 'Thank You for a Great Season!', messageContent: 'Thanks to everyone who joined an activity this season — see you next month!', audience: NotificationAudience.Everyone, status: NotificationStatus.Delivered, sentDaysAgo: 2 },
    { notificationTitle: 'Reminder: Update Your Profile', messageContent: 'Please make sure your profile photo and interests are up to date.', audience: NotificationAudience.Seniors, status: NotificationStatus.Delivered, sentDaysAgo: 1 },
  ];
  // Fan out to every active mobile user who allows notifications — mirrors compose()'s
  // real fan-out so seeded notifications actually appear in each user's mobile inbox.
  const recipientIds = (
    await userRepository.find({
      where: { role: UserRole.User, status: UserStatus.Active, allowNotifications: true },
      select: ['id'],
    })
  ).map((u) => u.id);

  let notifCount = 0;
  for (const n of demoNotifications) {
    let notification = await notificationRepository.findOne({ where: { notificationTitle: n.notificationTitle } });
    if (!notification) {
      notification = await notificationRepository.save(
        notificationRepository.create({
          notificationTitle: n.notificationTitle,
          messageContent: n.messageContent,
          audience: n.audience,
          status: n.status,
          sentBy: admin?.id ?? null,
        }),
      );
      await dataSource.query('UPDATE notifications SET sent_date = $1 WHERE id = $2', [
        daysAgo(n.sentDaysAgo),
        notification.id,
      ]);
      notifCount++;
    }
    if (recipientIds.length > 0) {
      await userNotificationRepository
        .createQueryBuilder()
        .insert()
        .values(recipientIds.map((userId) => ({ notificationId: notification!.id, userId })))
        .orIgnore()
        .execute();
    }
  }
  console.log(`Seeded ${notifCount} demo notifications, fanned out to ${recipientIds.length} mobile users`);

  await dataSource.destroy();
  console.log('--- Demo seed complete ---');
}

void seedDemo();
