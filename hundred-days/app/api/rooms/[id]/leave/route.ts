import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const BUCKET_NAME = "challenge-photos";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const supabase = await createClient();

  // 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  // Room + 현재 멤버십 확인
  const { data: membership, error: membershipError } =
    await supabase
      .from("members")
      .select(`
        id,
        user_id,
        challenge_id,
        challenges (
          id,
          owner_id
        )
      `)
      .eq("challenge_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

  if (membershipError) {
    console.error(
      "LEAVE ROOM MEMBERSHIP ERROR:",
      membershipError,
    );

    return NextResponse.json(
      { error: membershipError.message },
      { status: 500 },
    );
  }

  if (!membership) {
    return NextResponse.json(
      { error: "You are not a member of this room." },
      { status: 404 },
    );
  }

  const challenge = Array.isArray(membership.challenges)
    ? membership.challenges[0]
    : membership.challenges;

  // 방장은 탈퇴할 수 없음
  if (challenge?.owner_id === user.id) {
    return NextResponse.json(
      {
        error:
          "Room owners cannot leave their own room. Delete the room instead.",
      },
      { status: 400 },
    );
  }

  // Service Role client
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 해당 멤버의 사진 찾기
  const memberPath = `${id}/${membership.id}`;

  const { data: files, error: listError } =
    await admin.storage
      .from(BUCKET_NAME)
      .list(memberPath, {
        limit: 1000,
      });

  if (listError) {
    console.error(
      "LEAVE ROOM STORAGE LIST ERROR:",
      listError,
    );

    return NextResponse.json(
      { error: listError.message },
      { status: 500 },
    );
  }

  // 사진 삭제
  const filePaths =
    files
      ?.filter((file) => file.name)
      .map((file) => `${memberPath}/${file.name}`) ?? [];

  if (filePaths.length > 0) {
    const { error: removeError } =
      await admin.storage
        .from(BUCKET_NAME)
        .remove(filePaths);

    if (removeError) {
      console.error(
        "LEAVE ROOM STORAGE DELETE ERROR:",
        removeError,
      );

      return NextResponse.json(
        { error: removeError.message },
        { status: 500 },
      );
    }
  }

  // 멤버 삭제
  const { error: deleteError } = await supabase
    .from("members")
    .delete()
    .eq("id", membership.id)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error(
      "LEAVE ROOM DELETE ERROR:",
      deleteError,
    );

    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
  });
}